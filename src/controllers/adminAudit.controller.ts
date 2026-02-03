import { Request, Response, NextFunction } from 'express';
import adminAuditService from '../services/adminAudit.service';

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { userId, action, date } = req.query;

    const result = await adminAuditService.getAuditLogs(page, limit, {
      userId: userId as string,
      action: action as string,
      date: date as string,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
