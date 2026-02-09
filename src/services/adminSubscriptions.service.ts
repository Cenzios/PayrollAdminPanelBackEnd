import prisma from '../config/db';

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

  async getAllSubscriptions(_page: number, _limit: number) {
    return {
      message: 'Get all subscriptions service method',
    };
  }

  async getSubscriptionStats() {
    return {
      message: 'Get subscription stats service method',
    };
  }
}

export default new AdminSubscriptionsService();
