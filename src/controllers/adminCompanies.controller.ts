import { Request, Response, NextFunction } from 'express';
import adminCompaniesService from '../services/adminCompanies.service';

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const searchTerm = (req.query.search as string) || '';

        const data = await adminCompaniesService.getAllCompanies(page, limit, searchTerm);

        res.status(200).json({
            success: true,
            message: 'Companies fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
};
