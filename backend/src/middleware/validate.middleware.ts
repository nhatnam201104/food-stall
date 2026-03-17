import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response.util';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? (err as { path: string }).path : 'unknown',
      message: err.msg as string,
    }));

    sendError(res, 'Validation failed', StatusCodes.UNPROCESSABLE_ENTITY, formattedErrors);
    return;
  }

  next();
};
