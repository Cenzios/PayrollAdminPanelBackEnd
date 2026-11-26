import { Role, User, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/db';
import { jwtConfig } from '../config/jwt';
import { HttpError } from '../utils/httpError';
import {
    AccessTokenPayload,
    IssuedTokens,
    RefreshTokenPayload,
    SessionMeta,
} from '../types/auth';

const SESSION_REVOKED_MESSAGE = 'Session expired. Please log in again.';

const isUserBlocked = (user: Pick<User, 'status' | 'lockoutUntil'>): boolean => {
    return user.status === UserStatus.SUSPENDED || (user.lockoutUntil !== null && user.lockoutUntil > new Date());
};

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
 * Customer-account lockout policy. Must match Payroll-backEnd/src/services/auth.service.ts (login):
 * 3 failed attempts lock the account for 3 hours.
 */
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid credentials';

/** bcrypt hash of a random value; compared against when the account does not exist (equal timing). */
const DUMMY_HASH: Promise<string> = bcrypt.hash(randomUUID(), 12);

/**
 * A failed admin-panel login against a customer account counts toward that account's
 * lockout exactly like a failed customer login (same fields, same thresholds).
 */
const _recordCustomerLoginFailure = async (userId: string): Promise<void> => {
    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: { increment: 1 }, lastFailedLogin: new Date() },
            select: { failedLoginAttempts: true },
        });
        if (updated.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            await prisma.user.update({
                where: { id: userId },
                data: { lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
            });
        }
    } catch (error) {
        console.error('Failed to record failed login attempt:', error);
    }
};

/**
 * Admin login. Every failure (unknown email, wrong password, non-admin account, blocked
 * account) answers the same "Invalid credentials", so this endpoint cannot be used to test
 * customer passwords. Wrong passwords for customer accounts count toward their lockout.
 */
export const loginAdmin = async (email: string, password: string, meta: SessionMeta): Promise<IssuedTokens> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        await bcrypt.compare(password, await DUMMY_HASH);
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    const isCustomer = user.role !== Role.SUPER_ADMIN;
    const isLockedOut = user.lockoutUntil !== null && user.lockoutUntil > new Date();
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        // Locked customer accounts are not counted further (same as the customer API)
        if (isCustomer && !isLockedOut && user.status !== UserStatus.SUSPENDED) {
            await _recordCustomerLoginFailure(user.id);
        }
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

    if (isCustomer || isUserBlocked(user)) {
        throw new HttpError(401, INVALID_CREDENTIALS);
    }

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
        include: { user: true },
    });

    if (!session || session.userId !== payload.userId || session.logoutAt !== null) {
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    if (session.user.role !== Role.SUPER_ADMIN || isUserBlocked(session.user)) {
        await revokeSession(session.id);
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    // Single-use rotation: only the session's current jti may be exchanged, and only once.
    // The compare-and-set makes concurrent use of the same token fail for all but one caller.
    const nextJti = randomUUID();
    const rotated = await prisma.userLoginSession.updateMany({
        where: { id: session.id, logoutAt: null, refreshJti: payload.jti },
        data: { refreshJti: nextJti },
    });

    if (rotated.count !== 1) {
        // An already-used (or never issued) refresh token: treat as theft, revoke the whole session
        console.warn(`Refresh token reuse detected for session ${session.id}; session revoked`);
        await revokeSession(session.id);
        throw new HttpError(401, SESSION_REVOKED_MESSAGE);
    }

    return issueTokens(session.user, session.id, nextJti);
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
