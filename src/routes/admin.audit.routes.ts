import { Router } from 'express';
import {
  getAuditLogs,
} from '../controllers/adminAudit.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/', requireSuperAdmin, getAuditLogs);

export default router;
