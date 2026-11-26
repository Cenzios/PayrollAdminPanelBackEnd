export interface FieldError {
  field: string;
  message: string;
}

/**
 * Error with an HTTP status and a client-safe message.
 * Only HttpError messages are ever sent to clients by the error middleware.
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
