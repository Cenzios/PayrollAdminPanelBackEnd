import { Router } from 'express';
import {
  getRevenueSummary,
  getAllInvoices,
} from '../controllers/adminRevenue.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/summary', requireSuperAdmin, getRevenueSummary);
router.get('/invoices', requireSuperAdmin, getAllInvoices);

export default router;
