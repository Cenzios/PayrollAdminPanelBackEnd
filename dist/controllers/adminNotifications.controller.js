"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const adminNotifications_service_1 = __importDefault(require("../services/adminNotifications.service"));
const sendNotification = async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'userId, title, and message are required'
            });
        }
        const notification = await adminNotifications_service_1.default.sendNotification(userId, title, message);
        return res.status(201).json({
            success: true,
            data: notification
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send notification'
        });
    }
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=adminNotifications.controller.js.map