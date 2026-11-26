import { Router } from 'express';
import { query } from 'express-validator';
import { DocumentStatus } from '@prisma/client';
import { getPendingPayments, approvePayment, rejectPayment } from '../controllers/admin.manualpayments.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam } from '../validators/common.validators';
import { optionalMoneyBody } from '../validators/money.validators';

const router = Router();

// Routes for manual payments (admin only)
router.get(
    '/',
    requireSuperAdmin,
    query('status').optional({ values: 'falsy' }).isIn(Object.values(DocumentStatus)).withMessage('Invalid status'),
    validate,
    getPendingPayments
);
// Optional `amount`: the slip amount as read by the admin; must equal the settled invoice total (422 otherwise)
router.post('/:id/approve', requireSuperAdmin, idParam('id'), optionalMoneyBody('amount'), validate, approvePayment);
router.post('/:id/reject', requireSuperAdmin, idParam('id'), validate, rejectPayment);

export default router;
