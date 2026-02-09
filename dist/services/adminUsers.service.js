"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../config/db"));
class AdminUsersService {
    async getAllUsers(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const where = {
            role: client_1.Role.USER,
        };
        if (filters.status) {
            where.subscriptions = {
                some: {
                    status: filters.status,
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
            db_1.default.user.findMany({
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
                                    employees: true,
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
            db_1.default.user.count({ where }),
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
    async getUserById(userId) {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    include: {
                        plan: true,
                        addons: true,
                    },
                    orderBy: { createdAt: 'desc' },
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
        const sessionsSummary = {
            totalSessions: await db_1.default.userLoginSession.count({ where: { userId } }),
            lastTen: user.loginSessions,
            suspiciousCount: await db_1.default.userLoginSession.count({
                where: { userId, isSuspicious: true }
            }),
        };
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
    async updateUserStatus(_userId, _status) {
        return {
            message: 'Status update logic would go here',
        };
    }
}
exports.AdminUsersService = AdminUsersService;
exports.default = new AdminUsersService();
//# sourceMappingURL=adminUsers.service.js.map