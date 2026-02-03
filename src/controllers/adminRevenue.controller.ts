import { Request, Response, NextFunction } from 'express';

export const getRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get revenue stats endpoint',
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueByPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get revenue by period endpoint',
    });
  } catch (error) {
    next(error);
  }
};
