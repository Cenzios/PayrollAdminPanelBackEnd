import { Router } from 'express';
import {
  getSecurityLogs,
  getFailedLoginAttempts,
} from '../controllers/adminSecurity.controller';
import { protectAdmin } from '../middlewares/adminAuth.middleware';

const router = Router();

router.use(protectAdmin);

router.get('/logs', getSecurityLogs);
router.get('/failed-logins', getFailedLoginAttempts);

export default router;
