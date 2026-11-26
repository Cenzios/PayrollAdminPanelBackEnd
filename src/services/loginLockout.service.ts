import { User } from '@prisma/client';
import prisma from '../config/db';
import { LOCK_DURATION_MS, MAX_FAILED_LOGINS } from '../config/authPolicy';

type LockoutFields = Pick<User, 'id' | 'failedLoginAttempts' | 'lockoutUntil'>;

/** True while the account's failed-login lock is in force. */
export const isLoginLocked = (user: Pick<User, 'lockoutUntil'>, now: Date = new Date()): boolean => {
    return user.lockoutUntil !== null && user.lockoutUntil > now;
};

/**
 * Counts one failed login (call only when the account is not locked). An expired lock starts a
 * new count; the MAX_FAILED_LOGINS-th consecutive failure locks the account for LOCK_MINUTES.
 * Never throws: a failure to record is logged.
 */
export const _recordLoginFailure = async (user: LockoutFields): Promise<void> => {
    try {
        const now = new Date();
        const lockExpired = user.lockoutUntil !== null && user.lockoutUntil <= now;
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: lockExpired
                ? { failedLoginAttempts: 1, lockoutUntil: null, lastFailedLogin: now }
                : { failedLoginAttempts: { increment: 1 }, lastFailedLogin: now },
            select: { failedLoginAttempts: true },
        });
        if (updated.failedLoginAttempts >= MAX_FAILED_LOGINS) {
            await prisma.user.update({
                where: { id: user.id },
                data: { lockoutUntil: new Date(now.getTime() + LOCK_DURATION_MS) },
            });
        }
    } catch (error) {
        console.error('Failed to record failed login attempt:', error);
    }
};

/** A successful login ends the run of consecutive failures. Never throws. */
export const _resetLoginFailures = async (user: LockoutFields): Promise<void> => {
    if (user.failedLoginAttempts === 0 && user.lockoutUntil === null) return;
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null },
        });
    } catch (error) {
        console.error('Failed to reset failed login attempts:', error);
    }
};
