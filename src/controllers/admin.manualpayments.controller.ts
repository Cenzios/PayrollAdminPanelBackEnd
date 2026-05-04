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
        const document = await prisma.userDocument.update({
            where: { id },
            data: { status: DocumentStatus.APPROVED },
        });

        // Check if there is a pending subscription for this user to activate
        // We update pending activation to active
        await prisma.subscription.updateMany({
            where: {
                userId: document.userId,
                status: 'PENDING_ACTIVATION'
            },
            data: {
                status: 'ACTIVE',
                activatedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully',
            data: document,
        });
    } catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ success: false, message: 'Server error while approving payment' });
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
