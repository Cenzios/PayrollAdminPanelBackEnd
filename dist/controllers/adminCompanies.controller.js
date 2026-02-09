"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCompanies = void 0;
const adminCompanies_service_1 = __importDefault(require("../services/adminCompanies.service"));
const getAllCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';
        const data = await adminCompanies_service_1.default.getAllCompanies(page, limit, searchTerm);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching companies',
        });
    }
};
exports.getAllCompanies = getAllCompanies;
//# sourceMappingURL=adminCompanies.controller.js.map