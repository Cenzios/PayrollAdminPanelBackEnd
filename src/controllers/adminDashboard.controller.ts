import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/adminDashboard.service';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await dashboardService.getDashboardSummary();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
