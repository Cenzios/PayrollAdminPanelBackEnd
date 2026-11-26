import { body, param, query, ValidationChain } from 'express-validator';

// Shape-only id check: seeded rows use non-RFC ids (e.g. 77777777-7777-...), so isUUID() is too strict
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const idParam = (field: string): ValidationChain =>
    param(field).matches(ID_PATTERN).withMessage(`Invalid ${field}`);

export const idBody = (field: string): ValidationChain =>
    body(field).isString().withMessage(`${field} is required`).matches(ID_PATTERN).withMessage(`Invalid ${field}`);

export const paginationQuery: ValidationChain[] = [
    query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
];
