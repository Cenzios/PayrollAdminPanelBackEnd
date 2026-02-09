"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardSummary = async () => {
    const [activeUsers, totalCompanies, totalEmployees, totalIncomesData, recentLogs] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.company.count(),
        prisma.employee.count({ where: { status: 'ACTIVE' } }),
        prisma.invoice.aggregate({
            where: { status: 'PAID' },
            _sum: { totalAmount: true }
        }),
        prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        fullName: true
                    }
                }
            }
        })
    ]);
    const totalIncome = totalIncomesData._sum.totalAmount || 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthInvoices = await prisma.invoice.findMany({
        where: {
            status: 'PAID',
            billingMonth: currentMonth
        },
        select: {
            totalAmount: true
        }
    });
    const monthlyRevenue = currentMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const recentActivities = recentLogs.map(log => ({
        id: log.id,
        action: log.action,
        userName: log.user?.fullName || 'System',
        createdAt: log.createdAt,
        resourceType: log.resourceType
    }));
    const chartData = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const yearMonth = d.toISOString().slice(0, 7);
        const count = await prisma.user.count({
            where: {
                role: 'USER',
                createdAt: {
                    gte: new Date(yearMonth + '-01'),
                    lt: new Date(new Date(yearMonth + '-01').setMonth(new Date(yearMonth + '-01').getMonth() + 1))
                }
            }
        });
        chartData.push({ month: monthName, value: count });
    }
    return {
        activeUsers,
        totalCompanies,
        totalEmployees,
        monthlyRevenue,
        totalIncome,
        recentActivities,
        chartData
    };
};
exports.getDashboardSummary = getDashboardSummary;
//# sourceMappingURL=adminDashboard.service.js.map