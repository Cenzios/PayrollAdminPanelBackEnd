/**
 * Login lockout policy, shared by every login that counts failures on an account
 * (admin panel login for admin and customer accounts; the customer API uses the same values).
 */

/** Consecutive failed logins that lock the account. */
export const MAX_FAILED_LOGINS = 5;

/** How long a locked account stays locked. */
export const LOCK_MINUTES = 15;

export const LOCK_DURATION_MS = LOCK_MINUTES * 60 * 1000;
