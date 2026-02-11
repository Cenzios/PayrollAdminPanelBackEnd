import prisma from '../config/db';

export class AdminPlansService {
    async getAllPlans() {
        return await prisma.plan.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                features: true,
            },
        });
    }

    async updatePlan(id: string, data: {
        name?: string;
        employeePrice?: number;
        registrationFee?: number;
        maxEmployees?: number;
        description?: string;
    }) {
        // Only update the fields provided in the request
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.employeePrice !== undefined) updateData.employeePrice = data.employeePrice;
        if (data.registrationFee !== undefined) updateData.registrationFee = data.registrationFee;
        if (data.maxEmployees !== undefined) updateData.maxEmployees = data.maxEmployees;
        if (data.description !== undefined) updateData.description = data.description;

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
