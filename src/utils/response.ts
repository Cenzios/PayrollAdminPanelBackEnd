import { Request, Response } from 'express';
import { FieldError } from './httpError';

/** Standard API envelope returned by every admin API response. */
export interface ApiEnvelope<T = unknown> {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  success: boolean;
  message: string;
  data: T | null;
  /** Only present on 400 / 422 validation failures. */
  errors?: FieldError[];
}

/** Body shape that controllers/middlewares hand to `res.json` before enveloping. */
export interface ResponseBody<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: FieldError[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isFieldErrorArray = (value: unknown): value is FieldError[] => {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && typeof item.field === 'string' && typeof item.message === 'string');
};

/** True when `body` already is a complete envelope (avoids double wrapping). */
const isEnvelope = (body: Record<string, unknown>): boolean => {
  return typeof body.statusCode === 'number' && typeof body.timestamp === 'string'
    && typeof body.path === 'string' && typeof body.method === 'string';
};

/**
 * Builds the standard envelope from a `{ success, message, data, errors }` body.
 * Returns null when the body is not an API body (left untouched).
 */
export const buildEnvelope = (req: Request, statusCode: number, body: unknown): ApiEnvelope | null => {
  if (!isRecord(body) || typeof body.success !== 'boolean' || isEnvelope(body)) {
    return null;
  }

  const envelope: ApiEnvelope = {
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl.split('?')[0],
    method: req.method,
    success: body.success,
    message: typeof body.message === 'string' && body.message.length > 0
      ? body.message
      : (body.success ? 'Success' : 'Request failed'),
    data: body.data === undefined ? null : body.data,
  };

  // `errors` only ever accompanies 400 / 422 validation failures
  if ((statusCode === 400 || statusCode === 422) && isFieldErrorArray(body.errors)) {
    envelope.errors = body.errors;
  }

  return envelope;
};

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = 200
): Response => {
  const body: ResponseBody<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: FieldError[]
): Response => {
  const body: ResponseBody<null> = { success: false, message, data: null, errors };
  return res.status(statusCode).json(body);
};
