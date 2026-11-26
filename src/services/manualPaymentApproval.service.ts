import { DocumentStatus, Invoice, InvoiceStatus, Prisma, Subscription, SubscriptionStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../config/db';
import { HttpError } from '../utils/httpError';
import { moneyToString, toDecimal } from '../utils/money';

type Tx = Prisma.TransactionClient;

/** How a paid invoice was settled. Stored as PaymentIntent.gateway on the intent linked to the invoice. */
export const MANUAL_PAYMENT_GATEWAY = 'MANUAL';

/** All plans bill monthly (same period the customer API uses when it activates or renews). */
const BILLING_PERIOD_MONTHS = 1;

const OPEN_INVOICE_STATUSES: InvoiceStatus[] = [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE];

export type ApprovalOutcome = 'ACTIVATED' | 'EXTENDED' | 'INVOICE_ONLY';

export interface ApprovePaymentInput {
  documentId: string;
  adminId: string;
  /** Amount on the slip as read by the admin (decimal string). Optional. */
  amount?: string;
}

export interface ApprovalResultDto {
  documentId: string;
  outcome: ApprovalOutcome;
  invoice: { id: string; billingType: string; billingMonth: string; totalAmount: string; status: InvoiceStatus; paidAt: Date };
  subscription: { id: string; status: SubscriptionStatus; startDate: Date; endDate: Date };
  user: { email: string; fullName: string };
  message: string;
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

/**
 * The invoice a payment proof settles. user_document has no invoice link (its referenceId is
 * the customer's bank reference), so it is the user's oldest open (PENDING / OVERDUE) invoice.
 */
export const findTargetInvoice = async (tx: Tx | typeof prisma, userId: string): Promise<Invoice | null> => {
  return tx.invoice.findFirst({
    where: { userId, deletedAt: null, status: { in: OPEN_INVOICE_STATUSES } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
};

const _isFirstInvoice = async (tx: Tx, invoice: Invoice): Promise<boolean> => {
  if (invoice.billingType === 'REGISTRATION') return true;
  const earlier = await tx.invoice.count({
    where: { subscriptionId: invoice.subscriptionId, deletedAt: null, createdAt: { lt: invoice.createdAt } },
  });
  return earlier === 0;
};

/** Applies the payment to the invoice's subscription. Never cancels, recreates or rewinds one. */
const _applyToSubscription = async (
  tx: Tx,
  invoice: Invoice,
  subscription: Subscription,
  now: Date
): Promise<{ outcome: ApprovalOutcome; subscription: Subscription }> => {
  if (subscription.status === SubscriptionStatus.PENDING_ACTIVATION && await _isFirstInvoice(tx, invoice)) {
    const updated = await tx.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.ACTIVE, activatedAt: now, startDate: now, endDate: addBillingPeriod(now) },
    });
    return { outcome: 'ACTIVATED', subscription: updated };
  }

  if (subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.PAST_DUE) {
    // Renewal: extend from the current end date, so no paid days are lost
    const stillOverdue = await tx.invoice.count({
      where: { subscriptionId: subscription.id, id: { not: invoice.id }, deletedAt: null, status: InvoiceStatus.OVERDUE },
    });
    const updated = await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        endDate: addBillingPeriod(subscription.endDate),
        // A grace-period (PAST_DUE) subscription is ACTIVE again once nothing is overdue
        ...(subscription.status === SubscriptionStatus.PAST_DUE && stillOverdue === 0
          ? { status: SubscriptionStatus.ACTIVE }
          : {}),
      },
    });
    return { outcome: 'EXTENDED', subscription: updated };
  }

  // CANCELLED / EXPIRED / FAILED / DRAFT: settle the invoice only, the subscription stays as it is
  return { outcome: 'INVOICE_ONLY', subscription };
};

const _assertAmountMatches = (amount: string | undefined, invoice: Invoice): void => {
  if (amount === undefined) return;
  if (!new Decimal(amount).equals(toDecimal(invoice.totalAmount))) {
    const expected = moneyToString(invoice.totalAmount);
    throw new HttpError(422, `Slip amount ${amount} does not match the invoice total ${expected}`, [
      { field: 'amount', message: `Amount must equal the invoice total (${expected})` },
    ]);
  }
};

/** Moves a PENDING document to `status`; 404 if missing, 409 if it was already decided. */
export const claimPendingDocument = async (tx: Tx, documentId: string, status: DocumentStatus): Promise<void> => {
  const claimed = await tx.userDocument.updateMany({
    where: { id: documentId, status: DocumentStatus.PENDING },
    data: { status },
  });
  if (claimed.count === 1) return;

  const existing = await tx.userDocument.findUnique({ where: { id: documentId }, select: { status: true } });
  if (!existing) throw new HttpError(404, 'Payment document not found');
  throw new HttpError(409, `Payment proof has already been ${existing.status.toLowerCase()}`);
};

const _messageFor = (outcome: ApprovalOutcome): string => {
  if (outcome === 'ACTIVATED') return 'Payment approved. Invoice marked paid and subscription activated.';
  if (outcome === 'EXTENDED') return 'Payment approved. Invoice marked paid and subscription extended.';
  return 'Payment approved. Invoice marked paid; the subscription status was not changed.';
};

/**
 * Approves one manual payment proof, all in one transaction:
 * the document (must be PENDING) is APPROVED, exactly one invoice is marked PAID via a MANUAL
 * payment record, and that invoice's subscription is activated (first invoice of a pending
 * subscription) or extended from its current end date (renewal). No other invoice is touched.
 */
export const approveManualPayment = async (input: ApprovePaymentInput): Promise<ApprovalResultDto> => {
  return prisma.$transaction(async (tx): Promise<ApprovalResultDto> => {
    const doc = await tx.userDocument.findUnique({ where: { id: input.documentId }, include: { user: true } });
    if (!doc) throw new HttpError(404, 'Payment document not found');

    await claimPendingDocument(tx, doc.id, DocumentStatus.APPROVED);

    const invoice = await findTargetInvoice(tx, doc.userId);
    if (!invoice) throw new HttpError(409, 'This user has no open invoice to settle with this payment');
    _assertAmountMatches(input.amount, invoice);

    const subscription = await tx.subscription.findUnique({ where: { id: invoice.subscriptionId } });
    if (!subscription) throw new HttpError(409, 'The invoice has no subscription');

    const now = new Date();
    const manualPayment = await tx.paymentIntent.create({
      data: {
        userId: doc.userId,
        planId: invoice.planId,
        amount: invoice.totalAmount,
        gateway: MANUAL_PAYMENT_GATEWAY,
        status: 'SUCCEEDED',
        metadata: { userDocumentId: doc.id, invoiceId: invoice.id, approvedBy: input.adminId, referenceId: doc.referenceId },
      },
    });
    const paidInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.PAID, paidAt: now, paymentIntentId: manualPayment.id },
    });

    const applied = await _applyToSubscription(tx, invoice, subscription, now);
    if (applied.outcome !== 'INVOICE_ONLY') {
      await tx.user.update({ where: { id: doc.userId }, data: { isTrialUser: false } });
    }

    return {
      documentId: doc.id,
      outcome: applied.outcome,
      invoice: {
        id: paidInvoice.id,
        billingType: paidInvoice.billingType,
        billingMonth: paidInvoice.billingMonth,
        totalAmount: moneyToString(paidInvoice.totalAmount),
        status: paidInvoice.status,
        paidAt: now,
      },
      subscription: {
        id: applied.subscription.id,
        status: applied.subscription.status,
        startDate: applied.subscription.startDate,
        endDate: applied.subscription.endDate,
      },
      user: { email: doc.user.email, fullName: doc.user.fullName },
      message: _messageFor(applied.outcome),
    };
  }, { maxWait: 15000, timeout: 25000 });
};
