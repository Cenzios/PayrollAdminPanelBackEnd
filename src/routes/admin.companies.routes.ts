import { Router } from 'express';
import * as adminCompaniesController from '../controllers/adminCompanies.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

// All routes here are for super admins
router.use(requireSuperAdmin);

router.get('/', adminCompaniesController.getAllCompanies);

export default router;
