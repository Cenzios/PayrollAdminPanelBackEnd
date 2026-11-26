import { Prisma, SubscriptionStatus } from '@prisma/client';
import prisma from '../config/db';
import { moneyToString } from '../utils/money';

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  search?: string;
  planId?: string;
}

export interface SubscriptionListItemDto {
  id: string;
  status: SubscriptionStatus;
  user: { id: string; fullName: string; email: string };
  plan: { id: string; name: string; price: string; employeePrice: string; registrationFee: string };
  selectedAt: Date | null;
  activatedAt: Date | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface SubscriptionListDto {
  subscriptions: SubscriptionListItemDto[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export class AdminSubscriptionsService {
  async getSubscriptionTimeline(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllSubscriptions(page: number, limit: number, filters: SubscriptionFilters = {}): Promise<SubscriptionListDto> {
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.planId) where.planId = filters.planId;
    if (filters.search) {
      where.user = {
        OR: [
          { fullName: { contains: filters.search } },
          { email: { contains: filters.search } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: { select: { id: true, name: true, price: true, employeePrice: true, registrationFee: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        status: s.status,
        user: s.user,
        plan: {
          id: s.plan.id,
          name: s.plan.name,
          price: moneyToString(s.plan.price),
          employeePrice: moneyToString(s.plan.employeePrice),
          registrationFee: moneyToString(s.plan.registrationFee),
        },
        selectedAt: s.selectedAt,
        activatedAt: s.activatedAt,
        startDate: s.startDate,
        endDate: s.endDate,
        createdAt: s.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubscriptionStats() {
    return {
      message: 'Get subscription stats service method',
    };
  }
}

export default new AdminSubscriptionsService();
