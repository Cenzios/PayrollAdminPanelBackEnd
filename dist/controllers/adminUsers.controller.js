"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSubscriptionStatus = exports.getUserById = exports.getAllUsers = void 0;
const adminUsers_service_1 = __importDefault(require("../services/adminUsers.service"));
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const planName = req.query.planName;
        const status = req.query.status;
        const result = await adminUsers_service_1.default.getAllUsers(page, limit, { planName, status });
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await adminUsers_service_1.default.getUserById(userId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        if (error.message === 'User not found') {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        else {
            next(error);
        }
    }
};
exports.getUserById = getUserById;
const updateUserSubscriptionStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!status) {
            res.status(400).json({
                success: false,
                error: 'Status is required',
            });
            return;
        }
        const result = await adminUsers_service_1.default.updateUserStatus(userId, status);
        res.status(200).json({
            success: true,
            message: 'User subscription status updated successfully',
            data: result,
        });
    }
    catch (error) {
        if (error.message.includes('Invalid status') || error.message === 'No subscription found for this user') {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        else {
            next(error);
        }
    }
};
exports.updateUserSubscriptionStatus = updateUserSubscriptionStatus;
//# sourceMappingURL=adminUsers.controller.js.map