import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { FieldError, HttpError } from '../utils/httpError';

interface ErrorResponse {
  success: false;
  message: string;
  errors?: FieldError[];
}

interface ResolvedError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

const hasStatus = (error: unknown): error is { status: number; type?: string } => {
  return typeof error === 'object' && error !== null && typeof (error as { status?: unknown }).status === 'number';
};

// Maps any thrown value to a client-safe status + message. Never exposes Prisma/driver messages or stacks.
const resolveError = (error: unknown): ResolvedError => {
  if (error instanceof HttpError) {
    return { statusCode: error.statusCode, message: error.message, errors: error.errors };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return { statusCode: 404, message: 'Resource not found' };
    if (error.code === 'P2002') return { statusCode: 409, message: 'Resource already exists' };
    if (error.code === 'P2003') return { statusCode: 409, message: 'Related resource constraint failed' };
    return { statusCode: 500, message: 'Internal Server Error' };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: 'Invalid request' };
  }

  // body-parser errors (malformed JSON, payload too large)
  if (hasStatus(error) && error.status >= 400 && error.status < 500) {
    const message = error.type === 'entity.parse.failed' ? 'Malformed JSON body' : 'Invalid request';
    return { statusCode: error.status, message };
  }

  return { statusCode: 500, message: 'Internal Server Error' };
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode, message, errors } = resolveError(error);

  if (statusCode >= 500) {
    console.error(`Error on ${req.method} ${req.originalUrl}:`, error);
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  // `errors` array only accompanies 400/422 validation failures
  if (errors && (statusCode === 400 || statusCode === 422)) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
