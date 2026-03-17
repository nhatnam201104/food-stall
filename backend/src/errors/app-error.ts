import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST'): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
    return new AppError(message, StatusCodes.UNAUTHORIZED, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(message, StatusCodes.FORBIDDEN, code);
  }

  static notFound(message: string, code = 'NOT_FOUND'): AppError {
    return new AppError(message, StatusCodes.NOT_FOUND, code);
  }

  static conflict(message: string, code = 'CONFLICT'): AppError {
    return new AppError(message, StatusCodes.CONFLICT, code);
  }
}
