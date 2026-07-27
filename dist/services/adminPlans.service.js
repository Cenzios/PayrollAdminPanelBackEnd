"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlansService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AdminPlansService {
    async getAllPlans() {
        return await db_1.default.plan.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                features: true,
            },
        });
    }
    async updatePlan(id, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.employeePrice !== undefined)
            updateData.employeePrice = data.employeePrice;
        if (data.registrationFee !== undefined)
            updateData.registrationFee = data.registrationFee;
        if (data.maxEmployees !== undefined)
            updateData.maxEmployees = data.maxEmployees;
        if (data.description !== undefined)
            updateData.description = data.description;
        return await db_1.default.plan.update({
            where: { id },
            data: updateData,
            include: {
                features: true,
            },
        });
    }
}
exports.AdminPlansService = AdminPlansService;
exports.default = new AdminPlansService();
//# sourceMappingURL=adminPlans.service.js.map