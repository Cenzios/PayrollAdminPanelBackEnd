import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/adminDashboard.service';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const range = req.query.range as string || 'yearly';
    const stats = await dashboardService.getDashboardSummary(range);

    res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
