import { Request, Response } from 'express';
import { PrismaClient, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Get all pending manual payment proofs
export const getPendingPayments = async (_req: Request, res: Response) => {
    try {
        const documents = await prisma.userDocument.findMany({
            where: {
                status: DocumentStatus.PENDING,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
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
        const updatedDocument = await prisma.$transaction(async (tx) => {
            // Fetch the document first
            const doc = await tx.userDocument.findUnique({ where: { id } });
            if (!doc) throw new Error('Document not found');

            const targetUserId = doc.userId;

            // 1. Mark document as APPROVED
            const updatedDoc = await tx.userDocument.update({
                where: { id },
                data: { status: DocumentStatus.APPROVED },
            });

            // 2. Cancel Any Existing Trial (or Previous) Subscription
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

            // 3. Activate the Pending Paid Subscription
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

                // Calculate current active employee count for the user's companies
                const currentEmployeeCount = await tx.employee.count({
                    where: {
                        company: { ownerId: targetUserId },
                        deletedAt: null,
                    },
                });

                // Create the Initial "Registration" Invoice
                await tx.invoice.create({
                    data: {
                        userId: targetUserId,
                        subscriptionId: pendingSub.id,
                        planId: plan.id,
                        billingType: 'REGISTRATION',
                        billingMonth: new Date().toISOString().slice(0, 7), // e.g., "2026-05"
                        employeeCount: currentEmployeeCount,
                        pricePerEmployee: plan.employeePrice,
                        registrationFee: plan.registrationFee,
                        totalAmount: plan.registrationFee + currentEmployeeCount * plan.employeePrice,
                        status: 'PAID',
                        paidAt: new Date(),
                        dueDate: new Date(),
                        billingPeriodStart: pendingSub.startDate,
                        billingPeriodEnd: pendingSub.endDate,
                        planNameSnapshot: plan.name,
                    },
                });
            }

            // 4. Mark the User as a Paid User (Remove Trial Restrictions)
            await tx.user.update({
                where: { id: targetUserId },
                data: { isTrialUser: false },
            });

            return updatedDoc;
        }, {
            maxWait: 15000,
            timeout: 25000
        });

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully',
            data: updatedDocument,
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
        });

        res.status(200).json({
            success: true,
            message: 'Payment rejected successfully',
            data: document,
        });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ success: false, message: 'Server error while rejecting payment' });
    }
};
