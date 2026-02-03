import prisma from '../config/db';

export class AdminUsersService {
  async getAllUsers(page: number, limit: number) {
    return {
      message: 'Get all users service method',
    };
  }

  async getUserById(userId: string) {
    return {
      message: 'Get user by ID service method',
    };
  }

  async updateUserStatus(userId: string, status: string) {
    return {
      message: 'Update user status service method',
    };
  }
}

export default new AdminUsersService();
