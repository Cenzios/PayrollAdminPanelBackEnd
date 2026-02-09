export declare class AdminUsersService {
    getAllUsers(page?: number, limit?: number, filters?: {
        planName?: string;
        status?: string;
    }): Promise<{
        users: {
            id: string;
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            currentPlan: string;
            subscriptionStatus: import(".prisma/client").$Enums.SubscriptionStatus;
            companyCount: number;
            employeeCount: number;
            lastLogin: {
                ip: string;
                country: string;
                date: Date;
            } | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserById(userId: string): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            isEmailVerified: boolean;
            isPasswordSet: boolean;
            failedLoginAttempts: number;
            lockoutUntil: Date | null;
            createdAt: Date;
            accountStatus: string;
        };
        subscriptionHistory: {
            id: string;
            plan: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            startDate: Date;
            endDate: Date;
            activatedAt: Date | null;
        }[];
        invoiceHistory: {
            id: string;
            amount: number;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            month: string;
            type: import(".prisma/client").$Enums.BillingType;
            createdAt: Date;
        }[];
        activeAddons: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            type: string;
            value: number;
        }[];
        loginSessions: {
            totalSessions: number;
            lastTen: {
                id: string;
                createdAt: Date;
                userId: string;
                ipAddress: string;
                userAgent: string;
                loginAt: Date;
                deviceType: string | null;
                browser: string | null;
                os: string | null;
                country: string | null;
                city: string | null;
                logoutAt: Date | null;
                isSuspicious: boolean;
            }[];
            suspiciousCount: number;
        };
    }>;
    updateUserStatus(_userId: string, _status: string): Promise<{
        message: string;
    }>;
}
declare const _default: AdminUsersService;
export default _default;
//# sourceMappingURL=adminUsers.service.d.ts.map