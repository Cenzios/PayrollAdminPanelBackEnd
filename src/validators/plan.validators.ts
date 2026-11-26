import { body, ValidationChain } from 'express-validator';
import { idParam } from './common.validators';
import { optionalMoneyBody } from './money.validators';

export const updatePlanValidators: ValidationChain[] = [
    idParam('id'),
    body('name').optional().isString().withMessage('name must be a string').trim().notEmpty().withMessage('name cannot be empty').isLength({ max: 191 }),
    optionalMoneyBody('employeePrice'),
    optionalMoneyBody('registrationFee'),
    body('maxEmployees').optional().isInt({ min: 0 }).withMessage('maxEmployees must be a non-negative integer'),
    body('description').optional().isString().withMessage('description must be a string').isLength({ max: 191 }),
];
