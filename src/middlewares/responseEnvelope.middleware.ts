import { NextFunction, Request, Response } from 'express';
import { buildEnvelope } from '../utils/response';

/**
 * Wraps every JSON API body `{ success, message, data, errors? }` into the standard envelope
 * `{ statusCode, timestamp, path, method, success, message, data, errors? }`.
 * Additive: `success`, `message` and `data` keep their meaning for existing clients.
 */
export const responseEnvelope = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = (body?: unknown): Response => {
    const envelope = buildEnvelope(req, res.statusCode, body);
    return originalJson(envelope ?? body);
  };

  next();
};
