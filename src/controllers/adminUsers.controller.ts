import { Request, Response, NextFunction } from 'express';
import adminUsersService from '../services/adminUsers.service';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const planName = req.query.planName as string;
    const status = req.query.status as string;

    const result = await adminUsersService.getAllUsers(page, limit, { planName, status });

    res.status(200).json({
      success: true,
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
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      next(error);
    }
  }
};
