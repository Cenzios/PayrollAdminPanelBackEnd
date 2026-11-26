import { NextFunction, Request, Response } from 'express';
import adminPlansService from '../services/adminPlans.service';

export class AdminPlansController {
    async getAllPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const plans = await adminPlansService.getAllPlans();
            res.status(200).json({
                success: true,
                message: 'Plans fetched successfully',
                data: plans,
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { id } = req.params;
        // Body already validated by updatePlanValidators (money: decimal strings, numbers tolerated)
        const { name, employeePrice, registrationFee, maxEmployees, description } = req.body as {
            name?: string;
            employeePrice?: string | number;
            registrationFee?: string | number;
            maxEmployees?: number | string;
            description?: string;
        };

        try {
            const updatedPlan = await adminPlansService.updatePlan(id, {
                name,
                employeePrice,
                registrationFee,
                maxEmployees: maxEmployees !== undefined ? parseInt(String(maxEmployees), 10) : undefined,
                description,
            });

            res.status(200).json({
                success: true,
                message: 'Plan updated successfully',
                data: updatedPlan,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AdminPlansController();
