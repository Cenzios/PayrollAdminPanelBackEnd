import { body, ValidationChain } from 'express-validator';

// DECIMAL(19,4): up to 15 integer digits and 4 decimals, non-negative
const MONEY_PATTERN = /^\d{1,15}(\.\d{1,4})?$/;

/**
 * Optional money field: a decimal string ("1500.50"); a JSON number is tolerated for
 * backward compatibility. Validated on its string form, so no float maths is involved.
 */
export const optionalMoneyBody = (field: string): ValidationChain =>
    body(field)
        .optional()
        .custom((value: unknown): boolean => {
            if (typeof value !== 'string' && typeof value !== 'number') return false;
            if (typeof value === 'number' && !Number.isFinite(value)) return false;
            return MONEY_PATTERN.test(String(value).trim());
        })
        .withMessage(`${field} must be a non-negative decimal with at most 4 decimal places`)
        .bail()
        .isDecimal({ decimal_digits: '0,4' })
        .withMessage(`${field} must be a decimal`);
