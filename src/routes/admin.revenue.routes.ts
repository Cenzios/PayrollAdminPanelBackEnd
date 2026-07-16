import { Router } from 'express';
import {
  getRevenueSummary,
  getAllInvoices,
  sendReminder,
} from '../controllers/adminRevenue.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/summary', requireSuperAdmin, getRevenueSummary);
router.get('/invoices', requireSuperAdmin, getAllInvoices);
router.post('/remind/:invoiceId', requireSuperAdmin, sendReminder);

export default router;
