import { Router } from 'express';
import {
  getAllSubscriptions,
  getSubscriptionTimeline,
} from '../controllers/adminSubscriptions.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/', requireSuperAdmin, getAllSubscriptions);
router.get('/user/:userId', requireSuperAdmin, getSubscriptionTimeline);

export default router;
