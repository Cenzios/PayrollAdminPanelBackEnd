export declare class AdminAuditService {
    getAuditLogs(page?: number, limit?: number, filters?: {
        userId?: string;
        action?: string;
        date?: string;
    }): Promise<{
        logs: {
            id: string;
            userId: string | null;
            email: string;
            action: string;
            module: string;
            ipAddress: string;
            userAgent: string | null;
            createdAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
declare const _default: AdminAuditService;
export default _default;
//# sourceMappingURL=adminAudit.service.d.ts.map