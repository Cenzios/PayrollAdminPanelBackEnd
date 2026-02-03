import { Router } from 'express';
import {
  getAllSubscriptions,
  getSubscriptionStats,
} from '../controllers/adminSubscriptions.controller';
import { protectAdmin } from '../middlewares/adminAuth.middleware';

const router = Router();

router.use(protectAdmin);

router.get('/', getAllSubscriptions);
router.get('/stats', getSubscriptionStats);

export default router;
