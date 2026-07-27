"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminNotificationsService = void 0;
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
class AdminNotificationsService {
    async sendNotification(userId, title, message) {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return await db_1.default.notification.create({
            data: {
                userId,
                title,
                message,
                type: client_1.NotificationType.INFO,
            },
        });
    }
}
exports.AdminNotificationsService = AdminNotificationsService;
exports.default = new AdminNotificationsService();
//# sourceMappingURL=adminNotifications.service.js.map