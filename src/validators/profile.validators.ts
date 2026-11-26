import { body, ValidationChain } from 'express-validator';

export const updateProfileValidators: ValidationChain[] = [
    body('fullName').optional().isString().withMessage('fullName must be a string').trim().notEmpty().withMessage('fullName cannot be empty').isLength({ max: 191 }),
    body('email').optional().isString().trim().isEmail().withMessage('email must be valid').isLength({ max: 191 }),
];

export const changePasswordValidators: ValidationChain[] = [
    body('currentPassword').isString().withMessage('currentPassword is required').notEmpty().withMessage('currentPassword is required'),
    body('newPassword').isString().withMessage('newPassword is required').notEmpty().withMessage('newPassword is required').isLength({ max: 128 }),
];
