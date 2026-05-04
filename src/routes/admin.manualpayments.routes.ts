import { Router } from 'express';
import { getPendingPayments, approvePayment, rejectPayment } from '../controllers/admin.manualpayments.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

// Routes for manual payments (admin only)
router.get('/', requireSuperAdmin, getPendingPayments);
router.post('/:id/approve', requireSuperAdmin, approvePayment);
router.post('/:id/reject', requireSuperAdmin, rejectPayment);

export default router;
