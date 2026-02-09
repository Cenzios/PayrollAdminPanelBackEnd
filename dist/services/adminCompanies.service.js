"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCompaniesService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminCompaniesService {
    async getAllCompanies(page = 1, limit = 10, searchTerm = '') {
        const skip = (page - 1) * limit;
        const where = {};
        if (searchTerm) {
            where.name = {
                contains: searchTerm,
            };
        }
        const [companies, total] = await Promise.all([
            db_1.default.company.findMany({
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
                            employees: true,
                        },
                    },
                },
            }),
            db_1.default.company.count({ where }),
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
exports.AdminCompaniesService = AdminCompaniesService;
exports.default = new AdminCompaniesService();
//# sourceMappingURL=adminCompanies.service.js.map