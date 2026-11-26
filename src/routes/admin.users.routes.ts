import { Router } from 'express';
import { body, query } from 'express-validator';
import { SubscriptionStatus } from '@prisma/client';
import {
  getAllUsers,
  getUserById,
  updateUserSubscriptionStatus,
} from '../controllers/adminUsers.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam, paginationQuery } from '../validators/common.validators';

const router = Router();

const userStatuses = [...Object.values(SubscriptionStatus), 'SUSPENDED'];
const userIdParam = idParam('userId');

router.get(
  '/',
  requireSuperAdmin,
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(userStatuses).withMessage('Invalid status'),
  query('planName').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  validate,
  getAllUsers
);
router.get('/:userId', requireSuperAdmin, userIdParam, validate, getUserById);
router.put(
  '/:userId/subscription/status',
  requireSuperAdmin,
  userIdParam,
  body('status').isString().withMessage('Status is required').trim().notEmpty().withMessage('Status is required'),
  validate,
  updateUserSubscriptionStatus
);

export default router;
