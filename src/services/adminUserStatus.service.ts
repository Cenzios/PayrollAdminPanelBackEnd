import { Role, Subscription, SubscriptionStatus, UserStatus } from '@prisma/client';
import prisma from '../config/db';
import { HttpError } from '../utils/httpError';

/** Account statuses an admin can set (user.status only). */
export const ADMIN_ACCOUNT_STATUSES: readonly UserStatus[] = [UserStatus.ACTIVE, UserStatus.SUSPENDED];

/** Older suspensions also wrote this far-future lockout; it is cleared when the account is reactivated. */
const LEGACY_SUSPENSION_LOCKOUT_YEAR = 9999;

export interface AccountStatusDto {
  userId: string;
  status: UserStatus;
  message: string;
}

export interface SubscriptionStatusDto {
  subscription: Subscription;
  message: string;
}

const _findCustomer = async (userId: string): Promise<{ id: string; lockoutUntil: Date | null } | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, lockoutUntil: true },
  });
  if (!user || user.role !== Role.USER) {
    console.warn(`Account status change skipped: ${userId} is not a customer account`);
    return null;
  }
  return user;
};

/**
 * Suspends or reactivates a customer ACCOUNT. Only user.status changes: subscriptions are
 * never touched here (a suspension does not change any subscription, so reactivating has
 * nothing to restore; CANCELLED / EXPIRED subscriptions stay exactly as they are).
 * A temporary failed-login lockout is not lifted either.
 */
export const setAccountStatus = async (userId: string, status: UserStatus): Promise<AccountStatusDto> => {
  const user = await _findCustomer(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const clearsLegacyLockout = status === UserStatus.ACTIVE
    && user.lockoutUntil !== null
    && user.lockoutUntil.getUTCFullYear() >= LEGACY_SUSPENSION_LOCKOUT_YEAR;

  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      ...(clearsLegacyLockout ? { lockoutUntil: null, failedLoginAttempts: 0 } : {}),
    },
  });

  return {
    userId,
    status,
    message: status === UserStatus.SUSPENDED ? 'User suspended successfully' : 'User activated successfully',
  };
};

/**
 * Sets the status of the user's latest SUBSCRIPTION (separate from the account status).
 */
export const setLatestSubscriptionStatus = async (
  userId: string,
  status: SubscriptionStatus
): Promise<SubscriptionStatusDto> => {
  const user = await _findCustomer(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const latestSubscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestSubscription) {
    throw new HttpError(404, 'No subscription found for this user');
  }

  const subscription = await prisma.subscription.update({
    where: { id: latestSubscription.id },
    data: { status },
  });

  return { subscription, message: 'Subscription status updated successfully' };
};
