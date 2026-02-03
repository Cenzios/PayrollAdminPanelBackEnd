import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
} from '../controllers/adminUsers.controller';
import { protectAdmin } from '../middlewares/adminAuth.middleware';

const router = Router();

router.use(protectAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/status', updateUserStatus);

export default router;
