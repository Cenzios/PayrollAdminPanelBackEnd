import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
} from '../controllers/adminUsers.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';

const router = Router();

router.get('/', requireSuperAdmin, getAllUsers);
router.get('/:userId', requireSuperAdmin, getUserById);

export default router;
