import { Router } from 'express';
import { query } from 'express-validator';
import { BillingType, InvoiceStatus } from '@prisma/client';
import {
  getRevenueSummary,
  getAllInvoices,
  sendReminder,
} from '../controllers/adminRevenue.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam, paginationQuery } from '../validators/common.validators';

const router = Router();

router.get('/summary', requireSuperAdmin, getRevenueSummary);
router.get(
  '/invoices',
  requireSuperAdmin,
  ...paginationQuery,
  query('status').optional({ values: 'falsy' }).isIn(Object.values(InvoiceStatus)).withMessage('Invalid invoice status'),
  query('billingType').optional({ values: 'falsy' }).isIn(Object.values(BillingType)).withMessage('Invalid billing type'),
  query('month').optional({ values: 'falsy' }).matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('month must be YYYY-MM'),
  query('search').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  validate,
  getAllInvoices
);
router.post('/remind/:invoiceId', requireSuperAdmin, idParam('invoiceId'), validate, sendReminder);

export default router;
