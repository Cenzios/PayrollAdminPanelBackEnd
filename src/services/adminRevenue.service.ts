import prisma from '../config/db';

export class AdminRevenueService {
  async getRevenueSummary() {
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true },
    });

    const onlineRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paymentIntentId: { not: null }
      },
      _sum: { totalAmount: true },
    });

    const manualRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paymentIntentId: null
      },
      _sum: { totalAmount: true },
    });

    // Get recently overdue invoices count
    const overdueCount = await prisma.invoice.count({
      where: { status: 'OVERDUE' }
    });

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      onlineRevenue: onlineRevenue._sum.totalAmount || 0,
      manualRevenue: manualRevenue._sum.totalAmount || 0,
      overdueCount,
      monthlyRevenue: 0, // Could be calculated based on current month
    };
  }

  async getAllInvoices(page: number, limit: number, filters: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.billingType) where.billingType = filters.billingType;
    if (filters.month) where.billingMonth = filters.month;
    if (filters.search) {
      where.user = {
        fullName: { contains: filters.search }
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
      prisma.invoice.count({ where }),
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

  async getRevenueByPeriod(_startDate: Date, _endDate: Date) {
    return {
      message: 'Get revenue by period service method',
    };
  }
}

export default new AdminRevenueService();
