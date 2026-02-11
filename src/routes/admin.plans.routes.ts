import { Router } from 'express';
import adminPlansController from '../controllers/adminPlans.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

// Apply super admin protection to all plan routes
router.use(requireSuperAdmin);

router.get('/', adminPlansController.getAllPlans);
router.put('/:id', adminPlansController.updatePlan);

export default router;
