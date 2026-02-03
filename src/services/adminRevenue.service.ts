import prisma from '../config/db';

export class AdminRevenueService {
  async getRevenueStats() {
    return {
      message: 'Get revenue stats service method',
    };
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date) {
    return {
      message: 'Get revenue by period service method',
    };
  }
}

export default new AdminRevenueService();
