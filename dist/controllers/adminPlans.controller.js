"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlansController = void 0;
const adminPlans_service_1 = __importDefault(require("../services/adminPlans.service"));
class AdminPlansController {
    async getAllPlans(_req, res) {
        try {
            const plans = await adminPlans_service_1.default.getAllPlans();
            return res.status(200).json({
                success: true,
                data: plans,
            });
        }
        catch (error) {
            console.error('Error fetching plans:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch plans',
            });
        }
    }
    async updatePlan(req, res) {
        const { id } = req.params;
        const { name, employeePrice, registrationFee, maxEmployees, description } = req.body;
        try {
            const updatedPlan = await adminPlans_service_1.default.updatePlan(id, {
                name,
                employeePrice: employeePrice !== undefined ? Number(employeePrice) : undefined,
                registrationFee: registrationFee !== undefined ? Number(registrationFee) : undefined,
                maxEmployees: maxEmployees !== undefined ? Number(maxEmployees) : undefined,
                description,
            });
            return res.status(200).json({
                success: true,
                data: updatedPlan,
            });
        }
        catch (error) {
            console.error('Error updating plan:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update plan',
            });
        }
    }
}
exports.AdminPlansController = AdminPlansController;
exports.default = new AdminPlansController();
//# sourceMappingURL=adminPlans.controller.js.map