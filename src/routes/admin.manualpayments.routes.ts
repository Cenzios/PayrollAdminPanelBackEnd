import { Router } from 'express';
import { getPendingPayments, approvePayment, rejectPayment } from '../controllers/admin.manualpayments.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParam } from '../validators/common.validators';

const router = Router();

// Routes for manual payments (admin only)
router.get('/', requireSuperAdmin, getPendingPayments);
router.post('/:id/approve', requireSuperAdmin, idParam('id'), validate, approvePayment);
router.post('/:id/reject', requireSuperAdmin, idParam('id'), validate, rejectPayment);

export default router;
