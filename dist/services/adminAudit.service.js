"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminAuditService {
    async getAuditLogs(page = 1, limit = 20, filters = {}) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action) {
            where.action = {
                contains: filters.action,
            };
        }
        if (filters.date) {
            const startDate = new Date(filters.date);
            const endDate = new Date(filters.date);
            endDate.setDate(endDate.getDate() + 1);
            where.createdAt = {
                gte: startDate,
                lt: endDate,
            };
        }
        const [logs, total] = await Promise.all([
            db_1.default.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            }),
            db_1.default.auditLog.count({ where }),
        ]);
        return {
            logs: logs.map(l => ({
                id: l.id,
                userId: l.userId,
                email: l.user?.email || 'System',
                action: l.action,
                module: l.resourceType || 'System',
                ipAddress: l.ipAddress,
                userAgent: l.userAgent,
                createdAt: l.createdAt,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AdminAuditService = AdminAuditService;
exports.default = new AdminAuditService();
//# sourceMappingURL=adminAudit.service.js.map