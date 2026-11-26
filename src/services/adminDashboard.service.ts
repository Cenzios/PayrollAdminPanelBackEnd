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
  /** Chart for the requested `range` (kept for backward compatibility). */
  chartData: ChartPoint[];
  /** Chart for every range, so the panel needs a single summary request. */
  chartDataByRange: Record<ChartRange, ChartPoint[]>;
}

interface ChartPoint {
  month: string;
  value: number;
}

type ChartRange = 'monthly' | '3months' | '6months' | 'yearly';

const RANGE_MONTHS: Record<ChartRange, number> = { monthly: 2, '3months': 3, '6months': 6, yearly: 12 };

const isChartRange = (value: string): value is ChartRange => value in RANGE_MONTHS;

/** Registrations of USER accounts per calendar month, oldest first, for the last `months` months. */
const _getMonthlyRegistrations = async (months: number): Promise<ChartPoint[]> => {
  const now = new Date();
  const monthStarts = Array.from({ length: months + 1 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1));

  return Promise.all(monthStarts.slice(0, months).map(async (start, i): Promise<ChartPoint> => {
    const value = await prisma.user.count({
      where: { role: 'USER', createdAt: { gte: start, lt: monthStarts[i + 1] } },
    });
    return { month: start.toLocaleString('default', { month: 'short' }), value };
  }));
};

export const getDashboardSummary = async (range: string = 'yearly'): Promise<DashboardSummaryDto> => {
  const [
    activeUsers,
    totalCompanies,
    totalEmployees,
    totalIncomesData,
    recentLogs
  ] = await Promise.all([
    // Active users: customer accounts that are not suspended by an admin
    prisma.user.count({ where: { role: 'USER', status: 'ACTIVE' } }),
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

  // User registrations per month for the last 12 months; every range is a suffix of it,
  // so one request serves all chart ranges (the panel switches ranges without refetching).
  const yearly = await _getMonthlyRegistrations(12);
  const chartDataByRange: Record<ChartRange, ChartPoint[]> = {
    monthly: yearly.slice(-RANGE_MONTHS.monthly),
    '3months': yearly.slice(-RANGE_MONTHS['3months']),
    '6months': yearly.slice(-RANGE_MONTHS['6months']),
    yearly,
  };
  const chartData = chartDataByRange[isChartRange(range) ? range : 'yearly'];

  return {
    activeUsers,
    totalCompanies,
    totalEmployees,
    monthlyRevenue,
    totalIncome,
    recentActivities,
    chartData,
    chartDataByRange,
  };
};
