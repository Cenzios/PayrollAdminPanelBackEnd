import { Request, Response, NextFunction } from 'express';
import adminRevenueService from '../services/adminRevenue.service';

export const getRevenueSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminRevenueService.getRevenueSummary();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, billingType, month } = req.query;

    const result = await adminRevenueService.getAllInvoices(page, limit, {
      status: status as string,
      billingType: billingType as string,
      month: month as string
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
