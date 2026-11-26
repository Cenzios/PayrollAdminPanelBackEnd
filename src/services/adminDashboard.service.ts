import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { moneyToString, sumMoney } from '../utils/money';

/** Customer-API auth calls that are not user actions (hidden from the activity feed). */
const AUTH_NOISE_FILTERS: Prisma.AuditLogWhereInput[] = [
  { endpoint: { startsWith: '/api/v1/auth/refresh' } },
  { endpoint: { startsWith: '/api/v1/auth/check-lock-status' } },
  { endpoint: { startsWith: '/api/v1/auth/' }, userId: null },
];

interface DashboardSummaryDto {
  activeUsers: number;
  totalCompanies: number;
  totalEmployees: number;
  monthlyRevenue: string;
  totalIncome: string;
  recentActivities: { id: string; action: string; userName: string; createdAt: Date; resourceType: string | null; endpoint: string }[];
  chartData: { month: string; value: number }[];
}

export const getDashboardSummary = async (range: string = 'yearly'): Promise<DashboardSummaryDto> => {
  const [
    activeUsers,
    totalCompanies,
    totalEmployees,
    totalIncomesData,
    recentLogs
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.company.count(),
    prisma.employee.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true }
    }),
    prisma.auditLog.findMany({
      // Activity feed shows completed, meaningful actions only. Failed/rejected requests
      // (status >= 400, or no recorded status) stay on the security / audit pages, and
      // customer auth housekeeping (token refresh, lock-status checks, anonymous auth calls)
      // is noise that would otherwise show up as "Created Auth by System".
      where: { statusCode: { lt: 400 }, NOT: AUTH_NOISE_FILTERS },
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

  // Money is returned as strings (exact decimal values)
  const totalIncome = moneyToString(totalIncomesData._sum.totalAmount);

  // Calculate Monthly Revenue (sum of paid invoices in current month)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthInvoices = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      billingMonth: currentMonth
    },
    select: {
      totalAmount: true
    }
  });

  const monthlyRevenue = sumMoney(currentMonthInvoices.map((inv) => inv.totalAmount)).toString();

  // Format activities for frontend
  const recentActivities = recentLogs.map(log => ({
    id: log.id,
    action: log.action,
    userName: log.user?.fullName || 'System',
    createdAt: log.createdAt,
    resourceType: log.resourceType,
    endpoint: log.endpoint.split('?')[0],
  }));

  // Calculate Chart Data (Monthly User Registrations for last X months)
  let monthsToFetch = 12; // default yearly
  if (range === 'monthly') monthsToFetch = 2;
  else if (range === '3months') monthsToFetch = 3;
  else if (range === '6months') monthsToFetch = 6;
  else if (range === 'yearly') monthsToFetch = 12;

  const chartData = [];
  for (let i = monthsToFetch - 1; i >= 0; i--) {
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
