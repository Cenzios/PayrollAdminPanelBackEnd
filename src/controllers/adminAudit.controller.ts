import { Request, Response, NextFunction } from 'express';

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get audit logs endpoint',
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get audit log by ID endpoint',
    });
  } catch (error) {
    next(error);
  }
};
