import { Request, Response, NextFunction } from 'express';
import { SubscriptionStatus } from '@prisma/client';
import adminSubscriptionsService from '../services/adminSubscriptions.service';

export const getAllSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { status, search, planId } = req.query;

    const result = await adminSubscriptionsService.getAllSubscriptions(page, limit, {
      status: status as SubscriptionStatus | undefined,
      search: search as string | undefined,
      planId: planId as string | undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Subscriptions fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionTimeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await adminSubscriptionsService.getSubscriptionTimeline(userId);

    res.status(200).json({
      success: true,
      message: 'Subscription timeline fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
