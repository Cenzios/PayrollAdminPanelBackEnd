import { Prisma, Role, SubscriptionStatus, UserStatus } from '@prisma/client';
import prisma from '../config/db';
import { HttpError } from '../utils/httpError';
import { moneyToString, toDecimal } from '../utils/money';

type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface UserListFilters {
  planName?: string;
  /** SUSPENDED / LOCKED filter the account; any SubscriptionStatus filters the subscriptions. */
  status?: string;
  /** Matches full name or email, across all pages. */
  search?: string;
}

/** Account-level filters; everything else is treated as a subscription status. */
export const ACCOUNT_STATUS_FILTERS: readonly string[] = ['SUSPENDED', 'LOCKED'];

const _statusWhere = (status: string): Prisma.UserWhereInput => {
  // SUSPENDED = suspended by an admin (user.status) only; temporary lockouts are LOCKED
  if (status === 'SUSPENDED') return { status: UserStatus.SUSPENDED };
  if (status === 'LOCKED') return { status: UserStatus.ACTIVE, lockoutUntil: { gt: new Date() } };
  return { subscriptions: { some: { status: status as SubscriptionStatus } } };
};

const buildUserListWhere = (filters: UserListFilters): Prisma.UserWhereInput => {
  const conditions: Prisma.UserWhereInput[] = [{ role: Role.USER }];

  if (filters.status) conditions.push(_statusWhere(filters.status));
  if (filters.planName) {
    conditions.push({ subscriptions: { some: { plan: { name: { contains: filters.planName } } } } });
  }
  if (filters.search) {
    conditions.push({
      OR: [{ fullName: { contains: filters.search } }, { email: { contains: filters.search } }],
    });
  }

  return { AND: conditions };
};

/** SUSPENDED = suspended by an admin; LOCKED = temporary lockout after failed logins. */
const getAccountStatus = (status: UserStatus, lockoutUntil: Date | null): AccountStatus => {
  if (status === UserStatus.SUSPENDED) return 'SUSPENDED';
  if (lockoutUntil && lockoutUntil > new Date()) return 'LOCKED';
  return 'ACTIVE';
};

export class AdminUsersService {
  async getAllUsers(page: number = 1, limit: number = 10, filters: UserListFilters = {}) {
    const skip = (page - 1) * limit;
    const where = buildUserListWhere(filters);

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
          lockoutUntil: true,
          status: true,
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
              userDocuments: true,
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

      const totalEmployees = u.companies.reduce((acc, comp) => acc + comp._count.employees, 0);

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        currentPlan: activeSub?.plan?.name || 'N/A',
        // Account status (suspension / login lockout) is reported separately from the subscription
        userStatus: getAccountStatus(u.status, u.lockoutUntil),
        subscriptionStatus: activeSub?.status || 'NONE',
        companyCount: u._count.companies,
        paymentMethod: u._count.userDocuments > 0 ? 'Manual' : 'Online',
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
      throw new HttpError(404, 'User not found');
    }

    const sessionsSummary = {
      totalSessions: await prisma.userLoginSession.count({ where: { userId } }),
      lastTen: user.loginSessions,
      suspiciousCount: await prisma.userLoginSession.count({
        where: { userId, isSuspicious: true }
      }),
    };

    const activeSub = user.subscriptions[0];
    const totalEmployees = user.companies.reduce((acc, comp) => acc + comp._count.employees, 0);
    // Monthly bill = plan per-employee price x active (non-deleted) employees across the user's companies
    const monthlyBill = toDecimal(activeSub?.plan?.employeePrice).times(totalEmployees).toFixed(2);

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
        status: user.status,
        accountStatus: getAccountStatus(user.status, user.lockoutUntil),
      },
      currentSubscription: activeSub ? {
        planName: activeSub.plan.name,
        price: moneyToString(activeSub.plan.price),
        employeePrice: moneyToString(activeSub.plan.employeePrice),
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
        amount: moneyToString(i.totalAmount),
        status: i.status,
        month: i.billingMonth,
        type: i.billingType,
        createdAt: i.createdAt,
      })),
      activeAddons: user.subscriptions.flatMap(s => s.addons),
      loginSessions: sessionsSummary,
    };
  }
}

export default new AdminUsersService();