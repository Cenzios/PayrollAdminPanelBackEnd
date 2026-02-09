export declare class AdminSecurityService {
    getLoginSessions(page?: number, limit?: number): Promise<{
        sessions: {
            id: string;
            userId: string;
            email: string;
            ipAddress: string;
            userAgent: string;
            deviceType: string | null;
            browser: string | null;
            os: string | null;
            country: string | null;
            city: string | null;
            loginAt: Date;
            isSuspicious: boolean;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSuspiciousActivity(): Promise<{
        flaggedSessions: ({
            user: {
                email: string;
            };
        } & {
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
        })[];
        repeatedFailedLogins: {
            id: string;
            email: string;
            failedLoginAttempts: number;
            lastFailedLogin: Date | null;
            lockoutUntil: Date | null;
        }[];
        summary: {
            totalFlagged: number;
            totalLocked: number;
        };
    }>;
}
declare const _default: AdminSecurityService;
export default _default;
//# sourceMappingURL=adminSecurity.service.d.ts.map