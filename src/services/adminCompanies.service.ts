import { Prisma } from '@prisma/client';
import prisma from '../config/db';

export class AdminCompaniesService {
    async getAllCompanies(page: number = 1, limit: number = 10, searchTerm: string = '') {
        const skip = (page - 1) * limit;

        const where: Prisma.CompanyWhereInput = {};

        if (searchTerm) {
            where.name = {
                contains: searchTerm,
            };
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            subscriptions: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                select: {
                                    plan: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            employees: {
                                where: { deletedAt: null },
                            },
                        },
                    },
                },
            }),
            prisma.company.count({ where }),
        ]);

        const formattedCompanies = companies.map((c) => {
            const activeSub = c.owner.subscriptions[0];
            return {
                id: c.id,
                name: c.name,
                email: c.email,
                address: c.address,
                contactNumber: c.contactNumber,
                createdAt: c.createdAt,
                ownerName: c.owner.fullName,
                employeeCount: c._count.employees,
                subscriptionPlan: activeSub?.plan?.name || 'N/A',
            };
        });

        return {
            companies: formattedCompanies,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default new AdminCompaniesService();
