import { BillingType, InvoiceStatus, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { sendPaymentReminderEmail } from './email.service';
import { HttpError } from '../utils/httpError';
import { moneyToString } from '../utils/money';

export interface InvoiceFilters {
  status?: InvoiceStatus;
  billingType?: BillingType;
  month?: string;
  search?: string;
}

export interface RevenueSummaryDto {
  totalRevenue: string;
  onlineRevenue: string;
  manualRevenue: string;
  overdueCount: number;
  monthlyRevenue: string;
}

export class AdminRevenueService {
  async getRevenueSummary(): Promise<RevenueSummaryDto> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const [totalRevenue, onlineRevenue, manualRevenue, monthlyRevenue, overdueCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', paymentIntentId: { not: null } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', paymentIntentId: null },
        _sum: { totalAmount: true },
      }),
      // Same definition as the dashboard: paid invoices billed for the current month
      prisma.invoice.aggregate({
        where: { status: 'PAID', billingMonth: currentMonth },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ]);

    // Prisma `_sum` returns Decimal | null -> always serialize money as strings
    return {
      totalRevenue: moneyToString(totalRevenue._sum.totalAmount),
      onlineRevenue: moneyToString(onlineRevenue._sum.totalAmount),
      manualRevenue: moneyToString(manualRevenue._sum.totalAmount),
      overdueCount,
      monthlyRevenue: moneyToString(monthlyRevenue._sum.totalAmount),
    };
  }

  async getAllInvoices(page: number, limit: number, filters: InvoiceFilters) {
    const skip = (page - 1) * limit;
    const where: Prisma.InvoiceWhereInput = {};

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
      // Decimal columns (pricePerEmployee, registrationFee, totalAmount) serialize to JSON strings
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendReminder(invoiceId: string): Promise<{ invoiceId: string; sent: true }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: { email: true, fullName: true },
        },
      },
    });

    if (!invoice) {
      throw new HttpError(404, 'Invoice not found');
    }

    if (invoice.status !== 'OVERDUE') {
      throw new HttpError(400, 'Reminder can only be sent for overdue invoices');
    }

    const result = await sendPaymentReminderEmail(
      invoice.user.email,
      invoice.user.fullName,
      invoice.billingMonth,
      invoice.totalAmount.toString()
    );

    if (!result.success) {
      throw new HttpError(502, 'Reminder email could not be sent. Please try again later.');
    }

    return { invoiceId: invoice.id, sent: true };
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
