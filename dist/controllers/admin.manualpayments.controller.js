"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectPayment = exports.approvePayment = exports.getPendingPayments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPendingPayments = async (req, res) => {
    try {
        const { status } = req.query;
        const docStatus = status && Object.values(client_1.DocumentStatus).includes(status)
            ? status
            : client_1.DocumentStatus.PENDING;
        const documents = await prisma.userDocument.findMany({
            where: {
                status: docStatus,
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
    }
    catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching pending payments' });
    }
};
exports.getPendingPayments = getPendingPayments;
const approvePayment = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedDocument = await prisma.$transaction(async (tx) => {
            const doc = await tx.userDocument.findUnique({ where: { id } });
            if (!doc)
                throw new Error('Document not found');
            const targetUserId = doc.userId;
            const updatedDoc = await tx.userDocument.update({
                where: { id },
                data: { status: client_1.DocumentStatus.APPROVED },
            });
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
                const currentEmployeeCount = await tx.employee.count({
                    where: {
                        company: { ownerId: targetUserId },
                        deletedAt: null,
                    },
                });
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
                        billingPeriodStart: pendingSub.startDate,
                        billingPeriodEnd: pendingSub.endDate,
                        planNameSnapshot: plan.name,
                    },
                });
            }
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
    }
    catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while approving payment' });
    }
};
exports.approvePayment = approvePayment;
const rejectPayment = async (req, res) => {
    const { id } = req.params;
    try {
        const document = await prisma.userDocument.update({
            where: { id },
            data: { status: client_1.DocumentStatus.REJECTED },
        });
        res.status(200).json({
            success: true,
            message: 'Payment rejected successfully',
            data: document,
        });
    }
    catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ success: false, message: 'Server error while rejecting payment' });
    }
};
exports.rejectPayment = rejectPayment;
//# sourceMappingURL=admin.manualpayments.controller.js.map