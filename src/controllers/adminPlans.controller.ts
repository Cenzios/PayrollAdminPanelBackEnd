import { Request, Response } from 'express';
import adminPlansService from '../services/adminPlans.service';

export class AdminPlansController {
    async getAllPlans(_req: Request, res: Response) {
        try {
            const plans = await adminPlansService.getAllPlans();
            return res.status(200).json({
                success: true,
                data: plans,
            });
        } catch (error: any) {
            console.error('Error fetching plans:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch plans',
            });
        }
    }

    async updatePlan(req: Request, res: Response) {
        const { id } = req.params;
        const { name, employeePrice, registrationFee, maxEmployees, description } = req.body;

        try {
            const updatedPlan = await adminPlansService.updatePlan(id, {
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
        } catch (error: any) {
            console.error('Error updating plan:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update plan',
            });
        }
    }
}

export default new AdminPlansController();
