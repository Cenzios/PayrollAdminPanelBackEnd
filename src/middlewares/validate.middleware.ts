import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Runs after express-validator chains. Responds 422 with an `errors` array on failure.
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.type === 'field' ? err.path : err.type,
    message: String(err.msg),
  }));

  res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};
