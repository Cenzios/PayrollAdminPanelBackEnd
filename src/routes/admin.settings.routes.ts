import { Router } from 'express';
import * as adminProfileController from '../controllers/adminProfile.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { changePasswordValidators, updateProfileValidators } from '../validators/profile.validators';

const router = Router();

// All routes here require super admin privileges
router.use(requireSuperAdmin);

router.put('/profile', ...updateProfileValidators, validate, adminProfileController.updateProfileDetails);
router.put('/change-password', ...changePasswordValidators, validate, adminProfileController.updatePassword);

export default router;
