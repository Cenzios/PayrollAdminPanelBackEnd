"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuspiciousActivity = exports.getLoginSessions = void 0;
const adminSecurity_service_1 = __importDefault(require("../services/adminSecurity.service"));
const getLoginSessions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await adminSecurity_service_1.default.getLoginSessions(page, limit);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLoginSessions = getLoginSessions;
const getSuspiciousActivity = async (_req, res, next) => {
    try {
        const result = await adminSecurity_service_1.default.getSuspiciousActivity();
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSuspiciousActivity = getSuspiciousActivity;
//# sourceMappingURL=adminSecurity.controller.js.map