import { Invoice, Prisma, SubscriptionStatus } from '@prisma/client';
import { HttpError } from '../utils/httpError';

type Tx = Prisma.TransactionClient;

/** Largest number of employees (not deleted) in one of the user's companies: plan limits apply per company. */
const _largestCompanyHeadcount = async (tx: Tx, userId: string): Promise<number> => {
  const groups = await tx.employee.groupBy({
    by: ['companyId'],
    where: { company: { ownerId: userId }, deletedAt: null },
    _count: { _all: true },
  });
  return groups.reduce((max, g) => Math.max(max, g._count._all), 0);
};

/**
 * Approving a payment for a pending plan change re-checks the headcount against the new plan's
 * limit (plan maxEmployees + add-on slots, per company), the same rule the customer API applies
 * before it takes an online payment (planChange.service assertPendingPlanStillFits). 409 when a
 * company is over the limit, so the plan is never activated with more employees than it allows.
 */
export const assertPendingPlanStillFits = async (tx: Tx, invoice: Invoice): Promise<void> => {
  const subscription = await tx.subscription.findUnique({
    where: { id: invoice.subscriptionId },
    include: { plan: true, addons: true },
  });
  if (!subscription || subscription.status !== SubscriptionStatus.PENDING_ACTIVATION) return;

  const slots = subscription.addons
    .filter((addon) => addon.type === 'EMPLOYEE_EXTRA')
    .reduce((sum, addon) => sum + addon.value, 0);
  const limit = subscription.plan.maxEmployees + slots;
  const headcount = await _largestCompanyHeadcount(tx, invoice.userId);
  if (headcount > limit) {
    throw new HttpError(
      409,
      `This payment activates the ${subscription.plan.name} plan, which allows up to ${limit} employees per company, but one of the customer's companies now has ${headcount}. The customer must remove employees before this payment can be approved.`
    );
  }
};
