import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
} from '../controllers/adminAudit.controller';
import { protectAdmin } from '../middlewares/adminAuth.middleware';

const router = Router();

router.use(protectAdmin);

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

export default router;
