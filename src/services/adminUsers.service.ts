import { Prisma, Role } from '@prisma/client';
import prisma from '../config/db';

export class AdminUsersService {
  async getAllUsers(page: number = 1, limit: number = 10, filters: { planName?: string; status?: string } = {}) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.USER, // Typically admin only cares about normal users in this view
    };

    if (filters.status) {
      where.subscriptions = {
        some: {
          status: filters.status as any,
        },
      };
    }

    if (filters.planName) {
      where.subscriptions = {
        some: {
          plan: {
            name: {
              contains: filters.planName,
            },
          },
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              companies: true,
            },
          },
          companies: {
            select: {
              _count: {
                select: {
                  employees: {
                    where: { deletedAt: null },
                  },
                },
              },
            },
          },
          loginSessions: {
            orderBy: { loginAt: 'desc' },
            take: 1,
            select: {
              ipAddress: true,
              country: true,
              loginAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => {
      const activeSub = u.subscriptions[0];
      const lastSession = u.loginSessions[0];

      // Calculate total employees across all companies
      const totalEmployees = u.companies.reduce((acc, comp) => acc + comp._count.employees, 0);

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        currentPlan: activeSub?.plan?.name || 'N/A',
        subscriptionStatus: activeSub?.status || 'NONE',
        companyCount: u._count.companies,
        employeeCount: totalEmployees,
        lastLogin: lastSession ? {
          ip: lastSession.ipAddress,
          country: lastSession.country || 'Unknown',
          date: lastSession.loginAt,
        } : null,
      };
    });

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: {
            plan: true,
            addons: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        companies: {
          include: {
            _count: {
              select: { employees: { where: { deletedAt: null } } }
            }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        loginSessions: {
          take: 10,
          orderBy: { loginAt: 'desc' },
        },
        _count: {
          select: {
            companies: true,
            notifications: true,
          }
        }
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Login sessions summary
    const sessionsSummary = {
      totalSessions: await prisma.userLoginSession.count({ where: { userId } }),
      lastTen: user.loginSessions,
      suspiciousCount: await prisma.userLoginSession.count({
        where: { userId, isSuspicious: true }
      }),
    };

    const activeSub = user.subscriptions[0];
    const totalEmployees = user.companies.reduce((acc, comp) => acc + comp._count.employees, 0);

    // Calculate Monthly Bill (Basic Plan Price + Registration Fee snapshot or similar logic)
    // For now, let's use the Price from Plan.
    const monthlyBill = activeSub?.plan?.price || 0;

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPasswordSet: user.isPasswordSet,
        failedLoginAttempts: user.failedLoginAttempts,
        lockoutUntil: user.lockoutUntil,
        createdAt: user.createdAt,
        accountStatus: user.lockoutUntil && user.lockoutUntil > new Date() ? 'LOCKED' : 'ACTIVE',
      },
      currentSubscription: activeSub ? {
        planName: activeSub.plan.name,
        price: activeSub.plan.price,
        status: activeSub.status,
        startDate: activeSub.startDate,
        endDate: activeSub.endDate,
        maxEmployees: activeSub.plan.maxEmployees,
        extraSlots: activeSub.addons
          .filter(addon => addon.type === 'EMPLOYEE_EXTRA')
          .reduce((acc, addon) => acc + addon.value, 0),
      } : null,
      companies: user.companies.map(c => ({
        id: c.id,
        name: c.name,
        employeeCount: c._count.employees
      })),
      stats: {
        totalEmployees,
        monthlyBill,
        nextPaymentDate: activeSub?.endDate || null,
      },
      subscriptionHistory: user.subscriptions.map(s => ({
        id: s.id,
        plan: s.plan.name,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        activatedAt: s.activatedAt,
      })),
      invoiceHistory: user.invoices.map(i => ({
        id: i.id,
        amount: i.totalAmount,
        status: i.status,
        month: i.billingMonth,
        type: i.billingType,
        createdAt: i.createdAt,
      })),
      activeAddons: user.subscriptions.flatMap(s => s.addons),
      loginSessions: sessionsSummary,
    };
  }

  async updateUserStatus(userId: string, status: string) {
    // Validate status
    const validStatuses = ['DRAFT', 'PENDING_ACTIVATION', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Get the latest subscription for the user
    const latestSubscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestSubscription) {
      throw new Error('No subscription found for this user');
    }

    // Update the subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: latestSubscription.id },
      data: { status: status as any },
    });

    return updatedSubscription;
  }
}

export default new AdminUsersService();
