import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { toDecimal } from '../utils/money';

export interface UpdatePlanInput {
    name?: string;
    /** Decimal string (numbers are tolerated and converted via their string form) */
    employeePrice?: string | number;
    registrationFee?: string | number;
    maxEmployees?: number;
    description?: string;
}

const planWithFeatures = Prisma.validator<Prisma.PlanDefaultArgs>()({
    include: { features: true },
});

export type PlanWithFeatures = Prisma.PlanGetPayload<typeof planWithFeatures>;

export class AdminPlansService {
    async getAllPlans(): Promise<PlanWithFeatures[]> {
        // Decimal columns (price, employeePrice, registrationFee) serialize to JSON strings
        return await prisma.plan.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                features: true,
            },
        });
    }

    async updatePlan(id: string, data: UpdatePlanInput): Promise<PlanWithFeatures> {
        // Only update the fields provided in the request
        const updateData: Prisma.PlanUpdateInput = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.employeePrice !== undefined) {
            // `price` and `employeePrice` are the same "per employee per month" price (billing uses
            // employeePrice, the customer plan cards show price) — keep them in sync on every edit.
            const employeePrice = toDecimal(data.employeePrice).toString();
            updateData.employeePrice = employeePrice;
            updateData.price = employeePrice;
        }
        if (data.registrationFee !== undefined) updateData.registrationFee = toDecimal(data.registrationFee).toString();
        if (data.maxEmployees !== undefined) updateData.maxEmployees = data.maxEmployees;
        if (data.description !== undefined) updateData.description = data.description;

        // Missing plan -> Prisma P2025 -> 404 via the error middleware
        return await prisma.plan.update({
            where: { id },
            data: updateData,
            include: {
                features: true,
            },
        });
    }
}

export default new AdminPlansService();
