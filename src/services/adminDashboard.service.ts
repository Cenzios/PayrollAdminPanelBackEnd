import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSummary = async () => {
  const [
    totalUsers,
    activeSubscriptions,
    totalCompanies,
    totalEmployees,
    suspiciousLogins
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.userLoginSession.count({
      where: {
        isSuspicious: true,
        loginAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
        }
      }
    })
  ]);

  // Calculate Monthly Revenue (sum of paid invoices in current month)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      billingMonth: currentMonth
    },
    select: {
      totalAmount: true
    }
  });

  const monthlyRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return {
    totalUsers,
    activeSubscriptions,
    totalCompanies,
    totalEmployees,
    monthlyRevenue,
    suspiciousLogins
  };
};
