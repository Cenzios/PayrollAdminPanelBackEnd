import { Request, Response, NextFunction } from 'express';

export const getAllSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all subscriptions endpoint',
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get subscription stats endpoint',
    });
  } catch (error) {
    next(error);
  }
};
