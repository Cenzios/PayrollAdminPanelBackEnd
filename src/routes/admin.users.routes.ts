import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserSubscriptionStatus,
} from '../controllers/adminUsers.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/', requireSuperAdmin, getAllUsers);
router.get('/:userId', requireSuperAdmin, getUserById);
router.put('/:userId/subscription/status', requireSuperAdmin, updateUserSubscriptionStatus);

export default router;
