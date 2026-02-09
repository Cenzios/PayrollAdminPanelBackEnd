import { Prisma as _Prisma } from '@prisma/client';
import prisma from '../config/db';

export class AdminSecurityService {
  async getLoginSessions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.userLoginSession.findMany({
        skip,
        take: limit,
        orderBy: { loginAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.userLoginSession.count(),
    ]);

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        email: s.user.email,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        country: s.country,
        city: s.city,
        loginAt: s.loginAt,
        isSuspicious: s.isSuspicious,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSuspiciousActivity() {
    // 1. Flagged suspicious sessions
    const flaggedSessions = await prisma.userLoginSession.findMany({
      where: { isSuspicious: true },
      include: { user: { select: { email: true } } },
      orderBy: { loginAt: 'desc' },
      take: 50,
    });

    // 2. Repeated failed logins (Locked accounts or high attempt counts)
    const highRiskUsers = await prisma.user.findMany({
      where: {
        OR: [
          { failedLoginAttempts: { gte: 5 } },
          { lockoutUntil: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        email: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        lastFailedLogin: true,
      },
      orderBy: { lastFailedLogin: 'desc' },
    });

    // 3. Simple "Impossible Travel" stub (can be extended if session history exists)
    // For now returning the flaggedSessions as primary source for this.

    return {
      flaggedSessions,
      repeatedFailedLogins: highRiskUsers,
      summary: {
        totalFlagged: await prisma.userLoginSession.count({ where: { isSuspicious: true } }),
        totalLocked: await prisma.user.count({ where: { lockoutUntil: { gt: new Date() } } }),
      }
    };
  }
}

export default new AdminSecurityService();
