import { Router } from 'express';
import { query } from 'express-validator';
import { SubscriptionStatus } from '@prisma/client';
import {
  getAllSubscriptions,
  getSubscriptionTimeline,
} from '../controllers/adminSubscriptions.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam, paginationQuery } from '../validators/common.validators';

const router = Router();

router.get(
  '/',
  requireSuperAdmin,
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(Object.values(SubscriptionStatus)).withMessage('Invalid subscription status'),
  query('search').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  query('planId').optional({ values: 'falsy' }).isString().isLength({ max: 191 }),
  validate,
  getAllSubscriptions
);
router.get('/user/:userId', requireSuperAdmin, idParam('userId'), validate, getSubscriptionTimeline);

export default router;
