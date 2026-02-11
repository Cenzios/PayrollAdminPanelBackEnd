import { Router } from 'express';
import { sendNotification } from '../controllers/adminNotifications.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.post('/send', requireSuperAdmin, sendNotification);

export default router;
