import { randomUUID } from 'crypto';
import prisma from '../config/db';

/**
 * Single-use admin refresh tokens. The session stores the jti of its one current refresh token
 * (UserLoginSession.refreshJti); presenting any other jti is treated as theft and the session is revoked.
 *
 * Parallel refreshes with the same cookie (two tabs, a retried request) are not theft: rotations of
 * one session are serialised in-process, and for a short grace window the token that was just
 * replaced is answered with the current jti (no new rotation). Same rule as the customer API.
 */

/** How long a just-replaced refresh token is still answered with the current one. */
export const REUSE_GRACE_MS = 30_000;

interface RecentRotation {
    previousJti: string;
    currentJti: string;
    rotatedAt: number;
}

export type RefreshRotation =
    | { outcome: 'rotated'; jti: string }
    | { outcome: 'reused' }
    | { outcome: 'inactive' };

/** sid -> the last rotation (process memory, only needed for the grace window). */
const recentRotations = new Map<string, RecentRotation>();
/** sid -> tail of the queue of rotations in progress for that session. */
const rotationQueues = new Map<string, Promise<unknown>>();

const _rememberRotation = (sessionId: string, rotation: RecentRotation): void => {
    recentRotations.set(sessionId, rotation);
    setTimeout(() => {
        if (recentRotations.get(sessionId) === rotation) recentRotations.delete(sessionId);
    }, REUSE_GRACE_MS).unref();
};

const _isWithinGrace = (sessionId: string, presentedJti: string, currentJti: string): boolean => {
    const recent = recentRotations.get(sessionId);
    return recent !== undefined &&
        recent.previousJti === presentedJti &&
        recent.currentJti === currentJti &&
        Date.now() - recent.rotatedAt <= REUSE_GRACE_MS;
};

const _revoke = async (sessionId: string): Promise<void> => {
    await prisma.userLoginSession.updateMany({
        where: { id: sessionId, logoutAt: null },
        data: { logoutAt: new Date() },
    });
    recentRotations.delete(sessionId);
};

const _rotate = async (sessionId: string, presentedJti: string): Promise<RefreshRotation> => {
    const session = await prisma.userLoginSession.findFirst({
        where: { id: sessionId, logoutAt: null },
        select: { refreshJti: true },
    });
    if (!session) return { outcome: 'inactive' };

    if (session.refreshJti !== presentedJti) {
        if (session.refreshJti !== null && _isWithinGrace(sessionId, presentedJti, session.refreshJti)) {
            return { outcome: 'rotated', jti: session.refreshJti };
        }
        console.warn(`Refresh token reuse detected for session ${sessionId}; session revoked`);
        await _revoke(sessionId);
        return { outcome: 'reused' };
    }

    const jti = randomUUID();
    const updated = await prisma.userLoginSession.updateMany({
        where: { id: sessionId, logoutAt: null, refreshJti: presentedJti },
        data: { refreshJti: jti },
    });
    if (updated.count === 0) {
        // Another server instance rotated this token a moment ago: hand out its result.
        const latest = await prisma.userLoginSession.findFirst({
            where: { id: sessionId, logoutAt: null },
            select: { refreshJti: true },
        });
        return latest?.refreshJti ? { outcome: 'rotated', jti: latest.refreshJti } : { outcome: 'inactive' };
    }

    _rememberRotation(sessionId, { previousJti: presentedJti, currentJti: jti, rotatedAt: Date.now() });
    return { outcome: 'rotated', jti };
};

/** Checks the presented refresh-token jti against the session and rotates it (single use). */
export const rotateRefreshToken = async (sessionId: string, presentedJti: string): Promise<RefreshRotation> => {
    const previous = rotationQueues.get(sessionId) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(() => _rotate(sessionId, presentedJti));
    rotationQueues.set(sessionId, run);
    try {
        return await run;
    } finally {
        if (rotationQueues.get(sessionId) === run) rotationQueues.delete(sessionId);
    }
};
