"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const adminAudit_service_1 = __importDefault(require("../services/adminAudit.service"));
const getAuditLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { userId, action, date } = req.query;
        const result = await adminAudit_service_1.default.getAuditLogs(page, limit, {
            userId: userId,
            action: action,
            date: date,
        });
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=adminAudit.controller.js.map