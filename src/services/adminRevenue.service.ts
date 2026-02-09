import prisma from '../config/db';

export class AdminRevenueService {
  async getRevenueSummary() {
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true },
    });

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: 0, // Placeholder
      arpu: 0, // Placeholder
    };
  }

  async getAllInvoices(page: number, limit: number, filters: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.billingType) where.billingType = filters.billingType;
    if (filters.month) where.billingMonth = filters.month;

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
