import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import prisma from '../config/db';

type Client = Prisma.TransactionClient | typeof prisma;

export const OPEN_INVOICE_STATUSES: InvoiceStatus[] = [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE];

/** The proof fields that decide which invoice it settles. */
export interface PaymentProofRef {
  userId: string;
  /** user_document.invoice_id: the invoice the customer uploaded this slip for (null on legacy slips). */
  invoiceId: string | null;
}

/** Either the invoice an approval settles, or why the proof cannot settle one (409 message). */
export type TargetInvoiceResolution =
  | { invoice: Invoice; problem: null }
  | { invoice: null; problem: string };

const NO_OPEN_INVOICE = 'This user has no open invoice to settle with this payment';

const _unresolved = (problem: string): TargetInvoiceResolution => ({ invoice: null, problem });

const _linkedInvoice = async (client: Client, proof: PaymentProofRef, invoiceId: string): Promise<TargetInvoiceResolution> => {
  const invoice = await client.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.deletedAt !== null) {
    return _unresolved('The invoice linked to this payment proof no longer exists');
  }
  if (invoice.userId !== proof.userId) {
    return _unresolved('The invoice linked to this payment proof belongs to a different user');
  }
  if (!OPEN_INVOICE_STATUSES.includes(invoice.status)) {
    const state = invoice.status === InvoiceStatus.PAID ? 'already paid' : `${invoice.status.toLowerCase()}, not open`;
    return _unresolved(`The invoice linked to this payment proof (${invoice.billingMonth}) is ${state}`);
  }
  return { invoice, problem: null };
};

/**
 * The invoice a payment proof settles: exactly its linked invoice when user_document.invoice_id
 * is set (it must belong to the proof's user and be open), otherwise (legacy slips without a link)
 * the user's oldest open (PENDING / OVERDUE) invoice.
 */
export const resolveTargetInvoice = async (client: Client, proof: PaymentProofRef): Promise<TargetInvoiceResolution> => {
  if (proof.invoiceId !== null) {
    return _linkedInvoice(client, proof, proof.invoiceId);
  }
  const oldestOpen = await client.invoice.findFirst({
    where: { userId: proof.userId, deletedAt: null, status: { in: OPEN_INVOICE_STATUSES } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return oldestOpen ? { invoice: oldestOpen, problem: null } : _unresolved(NO_OPEN_INVOICE);
};
