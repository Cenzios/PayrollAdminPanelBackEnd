import { Request, Response, NextFunction } from 'express';

export const getSecurityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get security logs endpoint',
    });
  } catch (error) {
    next(error);
  }
};

export const getFailedLoginAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get failed login attempts endpoint',
    });
  } catch (error) {
    next(error);
  }
};
