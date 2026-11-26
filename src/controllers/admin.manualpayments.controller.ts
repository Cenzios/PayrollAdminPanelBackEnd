import { Request, Response, NextFunction } from 'express';
import { DocumentStatus } from '@prisma/client';
import prisma from '../config/db';
import { sendPaymentConfirmationEmail, sendPaymentRejectionEmail } from '../services/email.service';
import {
    approveManualPayment,
    claimPendingDocument,
    findTargetInvoice,
} from '../services/manualPaymentApproval.service';
import { HttpError } from '../utils/httpError';
import { moneyToString } from '../utils/money';

const isDocumentStatus = (value: unknown): value is DocumentStatus =>
    typeof value === 'string' && (Object.values(DocumentStatus) as string[]).includes(value);

interface TargetInvoiceDto {
    id: string;
    billingType: string;
    billingMonth: string;
    totalAmount: string;
    status: string;
}

/** For pending proofs: the invoice an approval would settle (so the admin can check the slip amount). */
const _targetInvoiceFor = async (userId: string): Promise<TargetInvoiceDto | null> => {
    const invoice = await findTargetInvoice(prisma, userId);
    if (!invoice) return null;
    return {
        id: invoice.id,
        billingType: invoice.billingType,
        billingMonth: invoice.billingMonth,
        totalAmount: moneyToString(invoice.totalAmount),
        status: invoice.status,
    };
};

// Get manual payment proofs by status (defaults to PENDING)
export const getPendingPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const docStatus = isDocumentStatus(req.query.status) ? req.query.status : DocumentStatus.PENDING;

        const documents = await prisma.userDocument.findMany({
            where: { status: docStatus },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const data = docStatus === DocumentStatus.PENDING
            ? await Promise.all(documents.map(async (doc) => ({ ...doc, targetInvoice: await _targetInvoiceFor(doc.userId) })))
            : documents;

        res.status(200).json({
            success: true,
            message: 'Payments fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
};

// Approve a manual payment proof: settles exactly one invoice (see manualPaymentApproval.service)
export const approvePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount } = req.body as { amount?: string | number };
        const adminId = req.user?.id;
        if (!adminId) throw new HttpError(401, 'Session expired. Please log in again.');

        const { user, message, ...result } = await approveManualPayment({
            documentId: req.params.id,
            adminId,
            amount: amount === undefined || amount === null ? undefined : String(amount).trim(),
        });

        sendPaymentConfirmationEmail(user.email, user.fullName).catch((err: unknown) => {
            console.error('Failed to send confirmation email after approval:', err);
        });

        res.status(200).json({ success: true, message, data: result });
    } catch (error) {
        next(error);
    }
};

// Reject a manual payment proof (PENDING only; anything else is 409 and sends no email)
export const rejectPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const document = await prisma.$transaction(async (tx) => {
            await claimPendingDocument(tx, id, DocumentStatus.REJECTED);
            return tx.userDocument.findUniqueOrThrow({
                where: { id },
                include: { user: { select: { fullName: true, email: true } } },
            });
        });

        sendPaymentRejectionEmail(document.user.email, document.user.fullName).catch((err: unknown) => {
            console.error('Failed to send rejection email after payment rejection:', err);
        });

        res.status(200).json({
            success: true,
            message: 'Payment rejected successfully and notification email sent',
            data: document,
        });
    } catch (error) {
        next(error);
    }
};
