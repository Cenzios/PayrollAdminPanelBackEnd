import prisma from '../config/db';
import { AdminAuditAction, adminPathSegments, firstUuid, resolveAdminAction } from '../utils/auditAction';

/** The audit_log fields needed to describe an activity. */
export interface ActivityLogRef {
  action: string;
  httpMethod: string;
  endpoint: string;
  resourceId: string | null;
}

type TargetKind = 'paymentProof' | 'user' | 'plan' | 'invoice' | 'none';

const TARGET_KIND: Record<AdminAuditAction, TargetKind> = {
  APPROVE_PAYMENT: 'paymentProof',
  REJECT_PAYMENT: 'paymentProof',
  SUSPEND_USER: 'user',
  ACTIVATE_USER: 'user',
  UPDATE_USER_STATUS: 'user',
  UPDATE_SUBSCRIPTION_STATUS: 'user',
  SEND_NOTIFICATION: 'user',
  UPDATE_PLAN: 'plan',
  SEND_PAYMENT_REMINDER: 'invoice',
  UPDATE_PROFILE: 'none',
  CHANGE_PASSWORD: 'none',
};

const LABEL: Record<AdminAuditAction, (target: string) => string> = {
  APPROVE_PAYMENT: (target) => `Approved payment for ${target}`,
  REJECT_PAYMENT: (target) => `Rejected payment for ${target}`,
  SUSPEND_USER: (target) => `Suspended user ${target}`,
  ACTIVATE_USER: (target) => `Activated user ${target}`,
  UPDATE_USER_STATUS: (target) => `Changed account status of ${target}`,
  UPDATE_SUBSCRIPTION_STATUS: (target) => `Changed subscription status of ${target}`,
  SEND_NOTIFICATION: (target) => `Sent a notification to ${target}`,
  UPDATE_PLAN: (target) => `Updated plan ${target}`,
  SEND_PAYMENT_REMINDER: (target) => `Sent a payment reminder to ${target}`,
  UPDATE_PROFILE: () => 'Updated the admin profile',
  CHANGE_PASSWORD: () => 'Changed the admin password',
};

const FALLBACK_TARGET: Record<TargetKind, string> = {
  paymentProof: 'a customer',
  user: 'a customer',
  plan: '(deleted plan)',
  invoice: 'a customer',
  none: '',
};

const isAdminAuditAction = (value: string): value is AdminAuditAction => value in LABEL;

/** Stored action, or (rows written before specific actions existed) the action derived from the endpoint. */
const _adminActionOf = (log: ActivityLogRef): AdminAuditAction | null => {
  if (isAdminAuditAction(log.action)) return log.action;
  if (!log.endpoint.startsWith('/api/admin/')) return null;
  return resolveAdminAction(log.httpMethod, adminPathSegments(log.endpoint));
};

const _idsOf = (logs: ActivityLogRef[], actions: (AdminAuditAction | null)[], kind: TargetKind): string[] => {
  const ids = logs
    .map((log, i) => {
      const action = actions[i];
      return action && TARGET_KIND[action] === kind ? log.resourceId ?? firstUuid(adminPathSegments(log.endpoint)) : null;
    })
    .filter((id): id is string => id !== null);
  return [...new Set(ids)];
};

const _displayName = (user: { fullName: string; email: string }): string => user.fullName || user.email;

/** id -> display name of the target, per kind (one query per kind). */
const _targetNames = async (logs: ActivityLogRef[], actions: (AdminAuditAction | null)[]): Promise<Map<string, string>> => {
  const [proofs, users, plans, invoices] = await Promise.all([
    prisma.userDocument.findMany({
      where: { id: { in: _idsOf(logs, actions, 'paymentProof') } },
      select: { id: true, user: { select: { fullName: true, email: true } } },
    }),
    prisma.user.findMany({ where: { id: { in: _idsOf(logs, actions, 'user') } }, select: { id: true, fullName: true, email: true } }),
    prisma.plan.findMany({ where: { id: { in: _idsOf(logs, actions, 'plan') } }, select: { id: true, name: true } }),
    prisma.invoice.findMany({
      where: { id: { in: _idsOf(logs, actions, 'invoice') } },
      select: { id: true, user: { select: { fullName: true, email: true } } },
    }),
  ]);
  return new Map<string, string>([
    ...proofs.map((p): [string, string] => [p.id, _displayName(p.user)]),
    ...users.map((u): [string, string] => [u.id, _displayName(u)]),
    ...plans.map((p): [string, string] => [p.id, p.name]),
    ...invoices.map((i): [string, string] => [i.id, _displayName(i.user)]),
  ]);
};

/**
 * Human-readable labels for admin actions, e.g. "Approved payment for Jane Doe" or
 * "Updated plan Basic". Entries that are not admin actions (customer activity) get null.
 */
export const describeActivities = async (logs: ActivityLogRef[]): Promise<(string | null)[]> => {
  const actions = logs.map(_adminActionOf);
  const names = await _targetNames(logs, actions);

  return logs.map((log, i) => {
    const action = actions[i];
    if (!action) return null;
    const id = log.resourceId ?? firstUuid(adminPathSegments(log.endpoint));
    const target = (id ? names.get(id) : undefined) ?? FALLBACK_TARGET[TARGET_KIND[action]];
    return LABEL[action](target);
  });
};
