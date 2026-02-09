import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || req.admin?.id;
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const userAgent = (req.headers['user-agent'] as string) || '';

      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            resourceType: resource,
            httpMethod: req.method,
            endpoint: req.originalUrl,
            ipAddress,
            userAgent,
            statusCode: res.statusCode,
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
