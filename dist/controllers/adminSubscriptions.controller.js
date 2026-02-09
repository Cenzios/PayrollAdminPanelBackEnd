"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionTimeline = exports.getAllSubscriptions = void 0;
const adminSubscriptions_service_1 = __importDefault(require("../services/adminSubscriptions.service"));
const getAllSubscriptions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await adminSubscriptions_service_1.default.getAllSubscriptions(page, limit);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllSubscriptions = getAllSubscriptions;
const getSubscriptionTimeline = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await adminSubscriptions_service_1.default.getSubscriptionTimeline(userId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubscriptionTimeline = getSubscriptionTimeline;
//# sourceMappingURL=adminSubscriptions.controller.js.map