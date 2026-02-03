import prisma from '../config/db';

export class AdminSubscriptionsService {
  async getAllSubscriptions(page: number, limit: number) {
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
