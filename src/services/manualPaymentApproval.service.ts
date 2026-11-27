import { DocumentStatus, Invoice, InvoiceStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../config/db';
import { HttpError } from '../utils/httpError';
import { moneyToString, toDecimal } from '../utils/money';
import { OPEN_INVOICE_STATUSES, resolveTargetInvoice } from './manualPaymentTarget.service';
import { assertPendingPlanStillFits } from './planLimit.service';
import { applyInvoicePayment, type PaymentOutcome } from './subscriptionLifecycle.service';

type Tx = Prisma.TransactionClient;

/** How a paid invoice was settled. Stored as PaymentIntent.gateway on the intent linked to the invoice. */
export const MANUAL_PAYMENT_GATEWAY = 'MANUAL';

/** Same outcomes as an online payment of the invoice (see subscriptionLifecycle.service). */
export type ApprovalOutcome = PaymentOutcome;

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

const _assertAmountMatches = (amount: string | undefined, invoice: Invoice): void => {
  if (amount === undefined) return;
  if (!new Decimal(amount).equals(toDecimal(invoice.totalAmount))) {
    const expected = toDecimal(invoice.totalAmount).toFixed(2);
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

  // Locking read: returns the latest committed status (a plain read would see this
  // transaction's earlier snapshot, i.e. still PENDING when another request just decided it).
  const rows = await tx.$queryRaw<{ status: string }[]>`SELECT status FROM user_document WHERE id = ${documentId} FOR UPDATE`;
  const current = rows[0]?.status;
  if (current === undefined) throw new HttpError(404, 'Payment document not found');
  if (current === DocumentStatus.PENDING) {
    throw new HttpError(409, 'This payment proof is being processed by another request. Please refresh and try again.');
  }
  throw new HttpError(409, `This payment proof was already ${current.toLowerCase()}`);
};

const _messageFor = (outcome: ApprovalOutcome): string => {
  if (outcome === 'ACTIVATED') return 'Payment approved. Invoice marked paid and subscription activated.';
  if (outcome === 'EXTENDED') return 'Payment approved. Invoice marked paid and subscription extended.';
  if (outcome === 'SETTLED') return 'Payment approved. Registration invoice marked paid; the subscription period was already granted at activation.';
  return 'Payment approved. Invoice marked paid; the subscription status was not changed.';
};

/**
 * Approves one manual payment proof, all in one transaction:
 * the document (must be PENDING) is APPROVED, exactly one invoice (the slip's linked invoice, or the
 * oldest open one for legacy slips without a link) is marked PAID via a MANUAL payment record, and
 * that invoice is applied to its subscription by the same rules as an online payment
 * (subscriptionLifecycle.service.applyInvoicePayment): activation ends the previous plan/trial,
 * a pay-later registration invoice does not add a period, a renewal extends from the current
 * end date. No other invoice is touched.
 */
export const approveManualPayment = async (input: ApprovePaymentInput): Promise<ApprovalResultDto> => {
  return prisma.$transaction(async (tx): Promise<ApprovalResultDto> => {
    const doc = await tx.userDocument.findUnique({ where: { id: input.documentId }, include: { user: true } });
    if (!doc) throw new HttpError(404, 'Payment document not found');

    await claimPendingDocument(tx, doc.id, DocumentStatus.APPROVED);

    // The slip's linked invoice (user_document.invoice_id), or the oldest open one for legacy slips
    const target = await resolveTargetInvoice(tx, { userId: doc.userId, invoiceId: doc.invoiceId });
    if (!target.invoice) throw new HttpError(409, target.problem);
    const invoice = target.invoice;
    _assertAmountMatches(input.amount, invoice);
    await assertPendingPlanStillFits(tx, invoice);

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
    // Conditional: an invoice settled meanwhile (another proof, an online payment) is not paid twice
    const settled = await tx.invoice.updateMany({
      where: { id: invoice.id, status: { in: OPEN_INVOICE_STATUSES } },
      data: { status: InvoiceStatus.PAID, paidAt: now, paymentIntentId: manualPayment.id },
    });
    if (settled.count !== 1) throw new HttpError(409, 'This invoice was settled by another payment a moment ago');

    const applied = await applyInvoicePayment(tx, invoice, now);
    if (!applied) throw new HttpError(409, 'The invoice has no subscription');
    // Read after applying: an activation moves the invoice's billing period to the activation date
    const paidInvoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoice.id } });

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
