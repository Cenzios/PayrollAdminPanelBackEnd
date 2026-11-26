import { Router } from 'express';
import { body } from 'express-validator';
import { sendNotification } from '../controllers/adminNotifications.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idBody } from '../validators/common.validators';

const router = Router();

router.post(
    '/send',
    requireSuperAdmin,
    idBody('userId'),
    body('title').isString().withMessage('title is required').trim().notEmpty().withMessage('title is required').isLength({ max: 191 }).withMessage('title is too long'),
    body('message').isString().withMessage('message is required').trim().notEmpty().withMessage('message is required').isLength({ max: 5000 }).withMessage('message is too long'),
    validate,
    sendNotification
);

export default router;
