import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import * as adminProfileController from '../controllers/adminProfile.controller';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Brute-force protection: only failed login attempts count towards the limit
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post(
    '/login',
    loginLimiter,
    body('email').isString().withMessage('Email is required').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Email must be valid'),
    body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password is required'),
    validate,
    authController.login
);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireSuperAdmin, adminProfileController.getProfileDetails);

export default router;
