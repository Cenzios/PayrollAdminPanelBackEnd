import { Router } from 'express';
import * as adminProfileController from '../controllers/adminProfile.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

// All routes here require super admin privileges
router.use(requireSuperAdmin);

router.put('/profile', adminProfileController.updateProfileDetails);
router.put('/change-password', adminProfileController.updatePassword);

export default router;
