import { Request, Response, NextFunction } from 'express';
import { SubscriptionStatus, UserStatus } from '@prisma/client';
import adminUsersService from '../services/adminUsers.service';
import { setAccountStatus, setLatestSubscriptionStatus } from '../services/adminUserStatus.service';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const planName = typeof req.query.planName === 'string' ? req.query.planName : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    const result = await adminUsersService.getAllUsers(page, limit, { planName, status, search });

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await adminUsersService.getUserById(userId);

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /admin/users/:userId/status: account suspension only (user.status). */
export const updateUserAccountStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body as { status: UserStatus };

    const result = await setAccountStatus(userId, status);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { userId: result.userId, status: result.status },
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /admin/users/:userId/subscription/status: the latest subscription's status only. */
export const updateUserSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body as { status: SubscriptionStatus };

    const result = await setLatestSubscriptionStatus(userId, status);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.subscription,
    });
  } catch (error) {
    next(error);
  }
};
