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
                // ✅ SCENARIO A: New signup — activate PENDING_ACTIVATION subscription
                await tx.subscription.update({
                    where: { id: pendingSub.id },
                    data: {
                        status: 'ACTIVE',
                        activatedAt: new Date(),
                        startDate: new Date(),
                        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    },
                });

                const plan = pendingSub.plan;

                // Mark any pre-existing PENDING/OVERDUE invoices for this subscription as PAID
                // (avoids duplicates if selectPlan already created an invoice)
                const existingInvoice = await tx.invoice.findFirst({
                    where: {
                        subscriptionId: pendingSub.id,
                        billingType: 'REGISTRATION',
                        status: { in: ['PENDING', 'OVERDUE'] },
                    },
                });

                if (existingInvoice) {
                    await tx.invoice.update({
                        where: { id: existingInvoice.id },
                        data: { status: 'PAID', paidAt: new Date() },
                    });
                    console.log(`🧾 [MANUAL APPROVAL] Existing REGISTRATION invoice ${existingInvoice.id} marked as PAID`);
                } else {
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
                            billingMonth: new Date().toISOString().slice(0, 7),
                            employeeCount: currentEmployeeCount,
                            pricePerEmployee: plan.employeePrice,
                            registrationFee: plan.registrationFee,
                            totalAmount: plan.registrationFee + currentEmployeeCount * plan.employeePrice,
                            status: 'PAID',
                            paidAt: new Date(),
                            dueDate: new Date(),
                            billingPeriodStart: new Date(),
                            billingPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                            planNameSnapshot: plan.name,
                        },
                    });
                }
            } else {
                // ✅ SCENARIO B: Renewal of a CANCELLED plan — re-activate it
                const cancelledSub = await tx.subscription.findFirst({
                    where: { userId: targetUserId, status: 'CANCELLED' },
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                });

                if (cancelledSub) {
                    console.log(`🔄 [MANUAL APPROVAL] Re-activating CANCELLED subscription ${cancelledSub.id} for user ${targetUserId}`);

                    const newEndDate = new Date();
                    newEndDate.setMonth(newEndDate.getMonth() + 1);

                    await tx.subscription.update({
                        where: { id: cancelledSub.id },
                        data: {
                            status: 'ACTIVE',
                            activatedAt: new Date(),
                            startDate: new Date(),
                            endDate: newEndDate,
                        },
                    });

                    // Mark ALL pending/overdue/failed invoices for this subscription as PAID
                    const subInvoices = await tx.invoice.findMany({
                        where: {
                            subscriptionId: cancelledSub.id,
                            status: { in: ['PENDING', 'OVERDUE', 'FAILED'] },
                        },
                    });

                    for (const inv of subInvoices) {
                        await tx.invoice.update({
                            where: { id: inv.id },
                            data: { status: 'PAID', paidAt: new Date() },
                        });
                        console.log(`🧾 [MANUAL APPROVAL] Invoice ${inv.id} (${inv.billingType}) marked as PAID`);
                    }

                    // Also catch any user-level pending invoices not linked to a specific subscription
                    if (subInvoices.length === 0) {
                        const userInvoices = await tx.invoice.findMany({
                            where: {
                                userId: targetUserId,
                                status: { in: ['PENDING', 'OVERDUE', 'FAILED'] },
                            },
                        });
                        for (const inv of userInvoices) {
                            await tx.invoice.update({
                                where: { id: inv.id },
                                data: { status: 'PAID', paidAt: new Date() },
                            });
                            console.log(`🧾 [MANUAL APPROVAL] User-level invoice ${inv.id} (${inv.billingType}) marked as PAID`);
                        }
                    }
                } else {
                    console.warn(`⚠️ [MANUAL APPROVAL] No PENDING_ACTIVATION or CANCELLED subscription found for user ${targetUserId}.`);
                }
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