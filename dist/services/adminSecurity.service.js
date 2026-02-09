"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSecurityService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminSecurityService {
    async getLoginSessions(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [sessions, total] = await Promise.all([
            db_1.default.userLoginSession.findMany({
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
            db_1.default.userLoginSession.count(),
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
        const flaggedSessions = await db_1.default.userLoginSession.findMany({
            where: { isSuspicious: true },
            include: { user: { select: { email: true } } },
            orderBy: { loginAt: 'desc' },
            take: 50,
        });
        const highRiskUsers = await db_1.default.user.findMany({
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
        return {
            flaggedSessions,
            repeatedFailedLogins: highRiskUsers,
            summary: {
                totalFlagged: await db_1.default.userLoginSession.count({ where: { isSuspicious: true } }),
                totalLocked: await db_1.default.user.count({ where: { lockoutUntil: { gt: new Date() } } }),
            }
        };
    }
}
exports.AdminSecurityService = AdminSecurityService;
exports.default = new AdminSecurityService();
//# sourceMappingURL=adminSecurity.service.js.map