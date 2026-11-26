import { Router } from 'express';
import adminPlansController from '../controllers/adminPlans.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updatePlanValidators } from '../validators/plan.validators';

const router = Router();

// Apply super admin protection to all plan routes
router.use(requireSuperAdmin);

router.get('/', adminPlansController.getAllPlans);
router.put('/:id', ...updatePlanValidators, validate, adminPlansController.updatePlan);

export default router;
