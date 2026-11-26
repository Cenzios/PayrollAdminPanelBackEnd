import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { adminPathSegments, firstUuid, resolveAdminAction } from '../utils/auditAction';

const MUTATION_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_FIELD_LENGTH = 191;

interface AuditTarget {
  action: string;
  resourceType: string;
  resourceId: string | null;
}

const _bodyField = (body: unknown, field: string): unknown =>
  typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[field] : undefined;

/** `PUT /api/admin/users/<id>/status {status:'SUSPENDED'}` -> { action: 'SUSPEND_USER', resourceType: 'users', resourceId: '<id>' } */
const _resolveTarget = (req: Request): AuditTarget => {
  const segments = adminPathSegments(req.originalUrl);
  const resourceType = segments[0] ?? 'unknown';
  const action = resolveAdminAction(req.method, segments, _bodyField(req.body, 'status'))
    ?? `${req.method}_${resourceType.toUpperCase()}`;
  // A notification targets the user in the body (the URL has no id)
  const bodyUserId = _bodyField(req.body, 'userId');
  const resourceId = firstUuid(segments)
    ?? (action === 'SEND_NOTIFICATION' && typeof bodyUserId === 'string' ? firstUuid([bodyUserId]) : null);
  return { action, resourceType, resourceId };
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

    const { action, resourceType, resourceId } = _resolveTarget(req);
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        loginSessionId: admin.sid,
        action,
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
