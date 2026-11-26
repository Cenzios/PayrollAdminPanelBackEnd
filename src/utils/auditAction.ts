/**
 * Names admin mutations for audit_log.action, e.g. APPROVE_PAYMENT instead of
 * POST_MANUAL-PAYMENTS, so the activity feed can tell approve, reject, suspend and
 * activate apart. Unknown routes fall back to METHOD_RESOURCE.
 */
export type AdminAuditAction =
  | 'APPROVE_PAYMENT'
  | 'REJECT_PAYMENT'
  | 'SUSPEND_USER'
  | 'ACTIVATE_USER'
  | 'UPDATE_USER_STATUS'
  | 'UPDATE_SUBSCRIPTION_STATUS'
  | 'UPDATE_PLAN'
  | 'SEND_NOTIFICATION'
  | 'SEND_PAYMENT_REMINDER'
  | 'UPDATE_PROFILE'
  | 'CHANGE_PASSWORD';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Path segments after `/api/admin`, without the query string: `/api/admin/users/<id>/status` -> ['users', '<id>', 'status']. */
export const adminPathSegments = (url: string): string[] => {
  const segments = url.split('?')[0].split('/').filter((part) => part.length > 0);
  const adminIndex = segments.indexOf('admin');
  return adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;
};

/** First UUID in the path (the resource the mutation acted on), if any. */
export const firstUuid = (segments: readonly string[]): string | null =>
  segments.find((part) => UUID_PATTERN.test(part)) ?? null;

const _userStatusAction = (requestedStatus: unknown): AdminAuditAction => {
  if (requestedStatus === 'SUSPENDED') return 'SUSPEND_USER';
  if (requestedStatus === 'ACTIVE') return 'ACTIVATE_USER';
  return 'UPDATE_USER_STATUS';
};

/**
 * The specific action for an admin mutation, or null when the route has no specific name.
 * `requestedStatus` is body.status (only known when the request is live, not for stored rows).
 */
export const resolveAdminAction = (method: string, segments: readonly string[], requestedStatus?: unknown): AdminAuditAction | null => {
  const [resource, , sub, subSub] = segments;
  const last = segments[segments.length - 1];

  if (resource === 'manual-payments' && method === 'POST') {
    if (last === 'approve') return 'APPROVE_PAYMENT';
    if (last === 'reject') return 'REJECT_PAYMENT';
  }
  if (resource === 'users' && method === 'PUT') {
    if (sub === 'status') return _userStatusAction(requestedStatus);
    if (sub === 'subscription' && subSub === 'status') return 'UPDATE_SUBSCRIPTION_STATUS';
  }
  if (resource === 'plans' && method === 'PUT') return 'UPDATE_PLAN';
  if (resource === 'notifications' && last === 'send') return 'SEND_NOTIFICATION';
  if (resource === 'revenue' && segments[1] === 'remind') return 'SEND_PAYMENT_REMINDER';
  if (last === 'change-password') return 'CHANGE_PASSWORD';
  if ((resource === 'settings' && last === 'profile') || (resource === 'profile' && last === 'update')) return 'UPDATE_PROFILE';
  return null;
};
