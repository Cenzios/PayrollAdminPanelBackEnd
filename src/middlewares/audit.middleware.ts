import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

const MUTATION_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FIELD_LENGTH = 191;

interface AuditTarget {
  resourceType: string;
  resourceId: string | null;
}

/** `/api/admin/users/<id>/status` -> { resourceType: 'users', resourceId: '<id>' } */
const _resolveTarget = (originalUrl: string): AuditTarget => {
  const segments = originalUrl.split('?')[0].split('/').filter((part) => part.length > 0);
  const adminIndex = segments.indexOf('admin');
  const rest = adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;
  return {
    resourceType: rest[0] ?? 'unknown',
    resourceId: rest.find((part) => UUID_PATTERN.test(part)) ?? null,
  };
};

const truncate = (value: string): string => value.slice(0, MAX_FIELD_LENGTH);

/**
 * Records every admin mutation (POST/PUT/PATCH/DELETE) in audit_log once the response
 * has been sent, with the acting admin, the login session, the client IP and the final
 * HTTP status. Must run after requireSuperAdmin (needs req.user). Never blocks or fails a request.
 */
export const auditAdminMutations = (req: Request, res: Response, next: NextFunction): void => {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    const admin = req.user;
    if (!admin) return;

    const { resourceType, resourceId } = _resolveTarget(req.originalUrl);
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        loginSessionId: admin.sid,
        action: `${req.method}_${resourceType.toUpperCase()}`,
        resourceType: truncate(`admin-${resourceType}`),
        resourceId,
        httpMethod: req.method,
        endpoint: truncate(req.originalUrl),
        ipAddress: truncate(req.ip || req.socket.remoteAddress || 'unknown'),
        userAgent: truncate(req.get('user-agent') || ''),
        statusCode: res.statusCode,
      },
    }).catch((error: unknown) => {
      console.error('Admin audit log write failed:', error);
    });
  });

  next();
};
