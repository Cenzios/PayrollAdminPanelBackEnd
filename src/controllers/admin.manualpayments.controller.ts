import { Request, Response } from 'express';
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { sendPaymentConfirmationEmail, sendPaymentRejectionEmail } from '../services/email.service';

const prisma = new PrismaClient();

// Get manual payment proofs by status (defaults to PENDING)
export const getPendingPayments = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const docStatus = status && Object.values(DocumentStatus).includes(status as any)
            ? status as DocumentStatus
            : DocumentStatus.PENDING;

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

        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching pending payments' });
    }
};

// Approve a manual payment proof
export const approvePayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const doc = await tx.userDocument.findUnique({
                where: { id },
                include: { user: true }
            });
            if (!doc) throw new Error('Document not found');

            const targetUserId = doc.userId;
            const userEmail = doc.user.email;
            const fullName = doc.user.fullName;

            // 1. Mark document as APPROVED
            const updatedDoc = await tx.userDocument.update({
                where: { id },
                data: { status: DocumentStatus.APPROVED },
            });

            // 2. Cancel any existing active subscription
            const currentActive = await tx.subscription.findFirst({
                where: { userId: targetUserId, status: 'ACTIVE' },
            });
            if (currentActive) {
                await tx.subscription.update({
                    where: { id: currentActive.id },
                    data: {
                        status: 'CANCELLED',
                        endDate: new Date(),
                    },
                });
            }

            // 3. Activate the pending paid subscription
            const pendingSub = await tx.subscription.findFirst({
                where: { userId: targetUserId, status: 'PENDING_ACTIVATION' },
                include: { plan: true },
            });

            if (pendingSub) {
                await tx.subscription.update({
                    where: { id: pendingSub.id },
                    data: {
                        status: 'ACTIVE',
                        activatedAt: new Date(),
                    },
                });

                const plan = pendingSub.plan;

                // Count active employees
                const currentEmployeeCount = await tx.employee.count({
                    where: {
                        company: { ownerId: targetUserId },
                        deletedAt: null,
                    },
                });

                // Remove registration fee from invoice
                const totalAmount = currentEmployeeCount * plan.employeePrice;

                // Create the "Registration" invoice (now without registration fee)
                await tx.invoice.create({
                    data: {
                        userId: targetUserId,
                        subscriptionId: pendingSub.id,
                        planId: plan.id,
                        billingType: 'REGISTRATION',
                        billingMonth: new Date().toISOString().slice(0, 7),
                        employeeCount: currentEmployeeCount,
                        pricePerEmployee: plan.employeePrice,
                        registrationFee: 0,                     
                        totalAmount: totalAmount,               
                        status: 'PAID',
                        paidAt: new Date(),
                        dueDate: new Date(),
                        billingPeriodStart: pendingSub.startDate,
                        billingPeriodEnd: pendingSub.endDate,
                        planNameSnapshot: plan.name,
                    },
                });
            }

            // 4. Mark user as paid (remove trial restrictions)
            await tx.user.update({
                where: { id: targetUserId },
                data: { isTrialUser: false },
            });

            return { updatedDoc, userEmail, fullName };
        }, {
            maxWait: 15000,
            timeout: 25000
        });

        // Send confirmation email
        sendPaymentConfirmationEmail(result.userEmail, result.fullName).catch(err => {
            console.error('Failed to send confirmation email after approval:', err);
        });

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully and confirmation email sent',
            data: result.updatedDoc,
        });
    } catch (error: any) {
        console.error('Error approving payment:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while approving payment' });
    }
};

// Reject a manual payment proof
export const rejectPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const document = await prisma.userDocument.update({
            where: { id },
            data: { status: DocumentStatus.REJECTED },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        sendPaymentRejectionEmail(document.user.email, document.user.fullName).catch(err => {
            console.error('Failed to send rejection email after payment rejection:', err);
        });

        res.status(200).json({
            success: true,
            message: 'Payment rejected successfully and notification email sent',
            data: document,
        });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ success: false, message: 'Server error while rejecting payment' });
    }
};