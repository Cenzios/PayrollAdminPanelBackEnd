import { Role, User, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/db';
import { jwtConfig } from '../config/jwt';
import { HttpError } from '../utils/httpError';
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from '../config/authPolicy';
import { _recordLoginFailure, _resetLoginFailures, isLoginLocked } from './loginLockout.service';
import { rotateRefreshToken } from './refreshRotation.service';
import {
    AccessTokenPayload,
    IssuedTokens,
    RefreshTokenPayload,
    SessionMeta,
} from '../types/auth';

const SESSION_REVOKED_MESSAGE = 'Session expired. Please log in again.';

const truncate = (value: string, max: number): string => value.slice(0, max);

/** Verifies a refresh JWT. Returns null (never throws) when invalid, expired or malformed. */
export const _decodeRefreshToken = (token: string): RefreshTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, jwtConfig.refreshSecret);
        if (typeof decoded === 'string') return null;
        const { userId, sid, type, jti } = decoded as Record<string, unknown>;
        if (typeof userId !== 'string' || typeof sid !== 'string' || type !== 'refresh' || typeof jti !== 'string') {
            return null;
        }
        return { userId, sid, type, jti };
    } catch {
        return null;
    }
};

/** Verifies an access JWT. Returns null (never throws) when invalid, expired, malformed or sid-less. */
export const _decodeAccessToken = (token: string): AccessTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        if (typeof decoded === 'string') return null;
        const { id, email, role, sid } = decoded as Record<string, unknown>;
        if (typeof id !== 'string' || typeof email !== 'string' || typeof role !== 'string' || typeof sid !== 'string') {
            return null;
        }
        return { id, email, role, sid };
    } catch {
        return null;
    }
};

/**
 * Signs an access token and a refresh token for the session. `refreshJti` must already be
 * stored as the session's current refreshJti (login: on create; refresh: by the rotation).
 */
const issueTokens = (user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>, sid: string, refreshJti: string): IssuedTokens => {
    const accessPayload: AccessTokenPayload = { id: user.id, email: user.email, role: user.role, sid };
    const token = jwt.sign(accessPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn as SignOptions['expiresIn'],
    });

    const refreshPayload: RefreshTokenPayload = { userId: user.id, sid, type: 'refresh', jti: refreshJti };
    const refreshToken = jwt.sign(refreshPayload, jwtConfig.refreshSecret, {
        expiresIn: jwtConfig.refreshExpiresIn as SignOptions['expiresIn'],
    });

    const decodedRefresh = jwt.decode(refreshToken);
    const exp = decodedRefresh !== null && typeof decodedRefresh !== 'string' ? decodedRefresh.exp : undefined;
    const refreshExpiresAt = new Date((exp ?? Math.floor(Date.now() / 1000)) * 1000);

    return {
        data: {
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        },
        refreshToken,
        refreshExpiresAt,
    };
};

/**
 * Every failed login answers exactly this (401), including while the account is locked, so the
 * endpoint reveals neither whether an account exists nor whether it is locked.
 */
const INVALID_CREDENTIALS = `Invalid credentials. After ${MAX_FAILED_LOGINS} failed attempts an account is locked for ${LOCK_MINUTES} minutes.`;

/** bcrypt hash of a random value; compared against when the account does not exist (equal timing). */
const DUMMY_HASH: Promise<string> = bcrypt.hash(randomUUID(), 12);

/**
 * Admin login. Every failure (unknown email, wrong password, non-admin account, suspended or
 * locked account) answers the same 401, so this endpoint cannot test customer passwords.
 * Lockout (admin and customer accounts alike): MAX_FAILED_LOGINS consecutive wrong passwords lock
 * the account for LOCK_MINUTES. While locked the password is still checked (same timing) but the
 * result is ignored and the attempt is not counted. The limit is per account, so it does not
 * depend on the client IP (a spoofed X-Forwarded-For changes nothing).
 */
export const loginAdmin = async (email: string, password: string, meta: SessionMeta): Promise<IssuedTokens> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        await bcrypt.compare(password, await DUMMY_HASH);
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    const isLocked = isLoginLocked(user);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isLocked) {
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    if (!isPasswordValid) {
        if (user.status !== UserStatus.SUSPENDED) {
            await _recordLoginFailure(user);
        }
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    if (user.role !== Role.SUPER_ADMIN || user.status === UserStatus.SUSPENDED) {
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    await _resetLoginFailures(user);

    const refreshJti = randomUUID();
    const session = await prisma.userLoginSession.create({
        data: {
            userId: user.id,
            ipAddress: truncate(meta.ipAddress, 191),
            userAgent: truncate(meta.userAgent, 191),
            refreshJti,
        },
        select: { id: true },
    });

    return issueTokens(user, session.id, refreshJti);
};

export const refreshAdminSession = async (refreshToken: string | undefined): Promise<IssuedTokens> => {
    const payload = refreshToken ? _decodeRefreshToken(refreshToken) : null;
    if (!payload) {
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    const session = await prisma.userLoginSession.findUnique({
        where: { id: payload.sid },
        select: {
            id: true,
            userId: true,
            logoutAt: true,
            user: { select: { id: true, email: true, fullName: true, role: true, status: true } },
        },
    });

    if (!session || session.userId !== payload.userId || session.logoutAt !== null) {
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    // A failed-login lock does not end live sessions (otherwise anyone could log an admin out
    // with a few wrong passwords); suspension does.
    if (session.user.role !== Role.SUPER_ADMIN || session.user.status === UserStatus.SUSPENDED) {
        await revokeSession(session.id);
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    // Single-use rotation with a 30 s grace window for parallel use of the same cookie
    const rotation = await rotateRefreshToken(session.id, payload.jti);
    if (rotation.outcome !== 'rotated') {
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    return issueTokens(session.user, session.id, rotation.jti);
};

/** Revokes a session by id. Idempotent. */
export const revokeSession = async (sid: string): Promise<void> => {
    await prisma.userLoginSession.updateMany({
        where: { id: sid, logoutAt: null },
        data: { logoutAt: new Date() },
    });
};

/**
 * Logout using the refresh cookie and/or the Bearer access token (either is enough).
 * Always succeeds; unknown/invalid tokens are simply ignored.
 */
export const logoutAdmin = async (refreshToken: string | undefined, accessToken: string | undefined): Promise<void> => {
    const sids = new Set<string>();

    const refreshPayload = refreshToken ? _decodeRefreshToken(refreshToken) : null;
    if (refreshPayload) sids.add(refreshPayload.sid);

    const accessPayload = accessToken ? _decodeAccessToken(accessToken) : null;
    if (accessPayload) sids.add(accessPayload.sid);

    await Promise.all([...sids].map((sid) => revokeSession(sid)));
};
