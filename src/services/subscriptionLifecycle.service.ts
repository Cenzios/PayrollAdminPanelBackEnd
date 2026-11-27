import { Invoice, InvoiceStatus, Prisma, Subscription, SubscriptionStatus } from '@prisma/client';

/**
 * Subscription state changes caused by a paid invoice, ported from the customer API's shared helper
 * (Payroll-backEnd/src/services/subscriptionLifecycle.service.ts: applyInvoicePayment,
 * activateSubscriptionNow, endSupersededSubscriptions). The two repos cannot share code, so a manual
 * approval must make exactly the decisions a Stripe/PayHere payment of the same invoice makes there.
 * Change one, change both.
 */

type Tx = Prisma.TransactionClient;

/** Seeded free-trial plan (same id as the customer API's FREE_TRIAL_PLAN_ID). */
export const FREE_TRIAL_PLAN_ID = '77777777-7777-7777-7777-777777777777';

/** Subscription states that are "live" (the customer is on this plan right now). */
const LIVE_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE];

/** All plans bill monthly. */
const BILLING_PERIOD_MONTHS = 1;

/**
 * - ACTIVATED: first invoice of a PENDING_ACTIVATION subscription; the previous plan/trial is ended.
 * - SETTLED: first (registration) invoice of an already live subscription (pay-later activation):
 *   the period was granted at activation, so endDate does not move.
 * - EXTENDED: renewal of a live subscription, one period from the current endDate.
 * - INVOICE_ONLY: CANCELLED / EXPIRED / FAILED / DRAFT subscription, or PENDING_ACTIVATION paid with a
 *   later invoice; only the invoice is settled.
 */
export type PaymentOutcome = 'ACTIVATED' | 'EXTENDED' | 'SETTLED' | 'INVOICE_ONLY';

export interface AppliedPayment {
  outcome: PaymentOutcome;
  subscription: Subscription;
}

/** Adds calendar months, clamping to the last day of the target month (Jan 31 + 1 -> Feb 28/29). */
export const addBillingPeriod = (from: Date): Date => {
  const result = new Date(from.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + BILLING_PERIOD_MONTHS);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
};

export const isTrialPlan = (planId: string): boolean => planId === FREE_TRIAL_PLAN_ID;

/**
 * Ends every other live subscription of the user once `keepId` is the plan they pay for:
 * a trial becomes EXPIRED (converted to paid), a replaced paid plan becomes CANCELLED (plan change).
 * endDate is cut to `now` (never moved later). The subscription table has no reason column, so the
 * reason is logged, as in the customer API.
 */
export const endSupersededSubscriptions = async (tx: Tx, userId: string, keepId: string, now: Date): Promise<number> => {
  const others = await tx.subscription.findMany({
    where: { userId, id: { not: keepId }, status: { in: LIVE_STATUSES } },
  });
  for (const other of others) {
    const trial = isTrialPlan(other.planId);
    await tx.subscription.update({
      where: { id: other.id },
      data: {
        status: trial ? SubscriptionStatus.EXPIRED : SubscriptionStatus.CANCELLED,
        endDate: other.endDate < now ? other.endDate : now,
      },
    });
    console.log(`[SUBSCRIPTION] ${other.id} ended (${trial ? 'EXPIRED: trial converted to paid' : 'CANCELLED: replaced by plan change'}) in favour of ${keepId}`);
  }
  return others.length;
};

/** Makes `subscriptionId` the live subscription now: ACTIVE for one billing period, previous plan/trial ended. */
export const activateSubscriptionNow = async (tx: Tx, subscriptionId: string, now: Date): Promise<Subscription> => {
  const activated = await tx.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.ACTIVE, activatedAt: now, startDate: now, endDate: addBillingPeriod(now) },
  });
  await endSupersededSubscriptions(tx, activated.userId, activated.id, now);
  await tx.user.update({ where: { id: activated.userId }, data: { isTrialUser: false } });
  return activated;
};

const _isFirstInvoice = async (tx: Tx, invoice: Invoice): Promise<boolean> => {
  if (invoice.billingType === 'REGISTRATION') return true;
  const earlier = await tx.invoice.count({
    where: { subscriptionId: invoice.subscriptionId, deletedAt: null, createdAt: { lt: invoice.createdAt } },
  });
  return earlier === 0;
};

/** Renewal of a live subscription: extend from the current endDate; ACTIVE only when nothing else is OVERDUE. */
const _renew = async (tx: Tx, invoice: Invoice, subscription: Subscription, extend: boolean): Promise<Subscription> => {
  const stillOverdue = await tx.invoice.count({
    where: { subscriptionId: invoice.subscriptionId, id: { not: invoice.id }, deletedAt: null, status: InvoiceStatus.OVERDUE },
  });
  return tx.subscription.update({
    where: { id: subscription.id },
    data: {
      ...(extend ? { endDate: addBillingPeriod(subscription.endDate) } : {}),
      ...(stillOverdue === 0 ? { status: SubscriptionStatus.ACTIVE } : {}),
    },
  });
};

/**
 * Applies a settled (already PAID) invoice to its subscription. Never rewinds endDate, never
 * creates a subscription, never activates anything without an invoice. Throws nothing itself;
 * the caller decides what a missing subscription means (null).
 */
export const applyInvoicePayment = async (tx: Tx, invoice: Invoice, now: Date): Promise<AppliedPayment | null> => {
  const subscription = await tx.subscription.findUnique({ where: { id: invoice.subscriptionId } });
  if (!subscription) {
    console.error(`[SUBSCRIPTION] Invoice ${invoice.id} has no subscription; payment recorded only`);
    return null;
  }

  const firstInvoice = await _isFirstInvoice(tx, invoice);

  if (subscription.status === SubscriptionStatus.PENDING_ACTIVATION && firstInvoice) {
    const activated = await activateSubscriptionNow(tx, subscription.id, now);
    // The paid period starts at activation, so the cron continues from the period actually paid for
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { billingPeriodStart: now, billingPeriodEnd: activated.endDate },
    });
    return { outcome: 'ACTIVATED', subscription: activated };
  }

  if (LIVE_STATUSES.includes(subscription.status)) {
    const renewed = await _renew(tx, invoice, subscription, !firstInvoice);
    await tx.user.update({ where: { id: subscription.userId }, data: { isTrialUser: false } });
    return { outcome: firstInvoice ? 'SETTLED' : 'EXTENDED', subscription: renewed };
  }

  return { outcome: 'INVOICE_ONLY', subscription };
};
