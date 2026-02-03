import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.admin?.id;
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      if (adminId) {
        await prisma.auditLog.create({
          data: {
            adminId,
            action,
            resource,
            details: JSON.stringify({
              method: req.method,
              path: req.path,
              body: req.body,
              params: req.params,
              query: req.query,
            }),
            ipAddress,
            userAgent,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Audit log error:', error);
      next();
    }
  };
};
