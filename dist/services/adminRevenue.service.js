"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRevenueService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminRevenueService {
    async getRevenueSummary() {
        const totalRevenue = await db_1.default.invoice.aggregate({
            where: { status: 'PAID' },
            _sum: { totalAmount: true },
        });
        return {
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            monthlyRevenue: 0,
            arpu: 0,
        };
    }
    async getAllInvoices(page, limit, filters) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.billingType)
            where.billingType = filters.billingType;
        if (filters.month)
            where.billingMonth = filters.month;
        const [invoices, total] = await Promise.all([
            db_1.default.invoice.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            fullName: true,
                        },
                    },
                },
            }),
            db_1.default.invoice.count({ where }),
        ]);
        return {
            invoices,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getRevenueStats() {
        return {
            message: 'Get revenue stats service method',
        };
    }
    async getRevenueByPeriod(_startDate, _endDate) {
        return {
            message: 'Get revenue by period service method',
        };
    }
}
exports.AdminRevenueService = AdminRevenueService;
exports.default = new AdminRevenueService();
//# sourceMappingURL=adminRevenue.service.js.map