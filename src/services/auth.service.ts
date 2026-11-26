import { Role, User, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
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
        const { userId, sid, type } = decoded as Record<string, unknown>;
        if (typeof userId !== 'string' || typeof sid !== 'string' || type !== 'refresh') return null;
        return { userId, sid, type };
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

const issueTokens = (user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>, sid: string): IssuedTokens => {
    const accessPayload: AccessTokenPayload = { id: user.id, email: user.email, role: user.role, sid };
    const token = jwt.sign(accessPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn as SignOptions['expiresIn'],
    });

    const refreshPayload: RefreshTokenPayload = { userId: user.id, sid, type: 'refresh' };
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

export const loginAdmin = async (email: string, password: string, meta: SessionMeta): Promise<IssuedTokens> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        throw new HttpError(401, 'Invalid credentials');
    }

    // Verify the password before revealing anything about the account (role/suspension)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new HttpError(401, 'Invalid credentials');
    }

    if (user.role !== Role.SUPER_ADMIN) {
        throw new HttpError(401, 'Access denied. Super admin only.');
    }

    if (isUserBlocked(user)) {
        throw new HttpError(401, 'Account is suspended');
    }

    const session = await prisma.userLoginSession.create({
        data: {
            userId: user.id,
            ipAddress: truncate(meta.ipAddress, 191),
            userAgent: truncate(meta.userAgent, 191),
        },
        select: { id: true },
    });

    return issueTokens(user, session.id);
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

    // Rotation: a fresh refresh token (new iat/exp) for the same session
    return issueTokens(session.user, session.id);
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
