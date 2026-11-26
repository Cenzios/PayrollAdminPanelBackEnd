import { Router } from 'express';
import { body, query } from 'express-validator';
import { SubscriptionStatus } from '@prisma/client';
import {
  getAllUsers,
  getUserById,
  updateUserAccountStatus,
  updateUserSubscriptionStatus,
} from '../controllers/adminUsers.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam, paginationQuery } from '../validators/common.validators';
import { ACCOUNT_STATUS_FILTERS } from '../services/adminUsers.service';
import { ADMIN_ACCOUNT_STATUSES } from '../services/adminUserStatus.service';

const router = Router();

const listStatusFilters = [...Object.values(SubscriptionStatus), ...ACCOUNT_STATUS_FILTERS];
const subscriptionStatuses = Object.values(SubscriptionStatus);
const userIdParam = idParam('userId');

router.get(
  '/',
  requireSuperAdmin,
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(listStatusFilters).withMessage('Invalid status'),
  query('planName').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  query('search').optional({ values: 'falsy' }).isString().isLength({ max: 191 }).withMessage('search is too long'),
  validate,
  getAllUsers
);
router.get('/:userId', requireSuperAdmin, userIdParam, validate, getUserById);

// Account suspension (user.status) only: never changes any subscription
router.put(
  '/:userId/status',
  requireSuperAdmin,
  userIdParam,
  body('status')
    .isIn(ADMIN_ACCOUNT_STATUSES)
    .withMessage(`status must be one of: ${ADMIN_ACCOUNT_STATUSES.join(', ')}`),
  validate,
  updateUserAccountStatus
);

// Subscription status (latest subscription) only: never changes the account status
router.put(
  '/:userId/subscription/status',
  requireSuperAdmin,
  userIdParam,
  body('status')
    .isIn(subscriptionStatuses)
    .withMessage(`status must be one of: ${subscriptionStatuses.join(', ')}. Use PUT /admin/users/:userId/status to suspend or activate the account`),
  validate,
  updateUserSubscriptionStatus
);

export default router;
