import { Router } from 'express';
import {
  getRevenueStats,
  getRevenueByPeriod,
} from '../controllers/adminRevenue.controller';
import { protectAdmin } from '../middlewares/adminAuth.middleware';

const router = Router();

router.use(protectAdmin);

router.get('/stats', getRevenueStats);
router.get('/period', getRevenueByPeriod);

export default router;
