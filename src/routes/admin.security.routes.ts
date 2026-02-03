import { Router } from 'express';
import {
  getLoginSessions,
  getSuspiciousActivity,
} from '../controllers/adminSecurity.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/login-sessions', requireSuperAdmin, getLoginSessions);
router.get('/suspicious', requireSuperAdmin, getSuspiciousActivity);

export default router;
