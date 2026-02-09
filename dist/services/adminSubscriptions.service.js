"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSubscriptionsService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminSubscriptionsService {
    async getSubscriptionTimeline(userId) {
        return db_1.default.subscription.findMany({
            where: { userId },
            include: {
                plan: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllSubscriptions(_page, _limit) {
        return {
            message: 'Get all subscriptions service method',
        };
    }
    async getSubscriptionStats() {
        return {
            message: 'Get subscription stats service method',
        };
    }
}
exports.AdminSubscriptionsService = AdminSubscriptionsService;
exports.default = new AdminSubscriptionsService();
//# sourceMappingURL=adminSubscriptions.service.js.map