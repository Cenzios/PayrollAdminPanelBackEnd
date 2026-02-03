import { Router } from 'express';
import * as dashboardController from '../controllers/adminDashboard.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/summary', requireSuperAdmin, dashboardController.getDashboardStats);

export default router;
