"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllInvoices = exports.getRevenueSummary = void 0;
const adminRevenue_service_1 = __importDefault(require("../services/adminRevenue.service"));
const getRevenueSummary = async (_req, res, next) => {
    try {
        const result = await adminRevenue_service_1.default.getRevenueSummary();
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenueSummary = getRevenueSummary;
const getAllInvoices = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, billingType, month } = req.query;
        const result = await adminRevenue_service_1.default.getAllInvoices(page, limit, {
            status: status,
            billingType: billingType,
            month: month
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
exports.getAllInvoices = getAllInvoices;
//# sourceMappingURL=adminRevenue.controller.js.map