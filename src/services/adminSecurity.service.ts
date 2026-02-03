import prisma from '../config/db';

export class AdminSecurityService {
  async getSecurityLogs(page: number, limit: number) {
    return {
      message: 'Get security logs service method',
    };
  }

  async getFailedLoginAttempts() {
    return {
      message: 'Get failed login attempts service method',
    };
  }
}

export default new AdminSecurityService();
