import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/app-error';
import { sendError } from '../utils/response.util';
import { config } from '../config';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational errors (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) || [];
      sendError(res, `A record with this ${fields.join(', ')} already exists.`, StatusCodes.CONFLICT);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found.', StatusCodes.NOT_FOUND);
      return;
    }
    sendError(res, 'Database error', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    sendError(res, err.message, StatusCodes.BAD_REQUEST);
    return;
  }

  // Default
  if (config.env === 'development') {
    console.error('[ERROR]', err);
  }

  sendError(res, 'Internal server error', StatusCodes.INTERNAL_SERVER_ERROR);
};
