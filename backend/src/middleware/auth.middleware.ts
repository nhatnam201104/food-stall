import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/app-error';
import { verifyToken } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Authentication token required', StatusCodes.UNAUTHORIZED);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', StatusCodes.UNAUTHORIZED);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      req.user = verifyToken(token);
    } catch {
      req.user = undefined;
    }
  }

  next();
};

export const authorize = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', StatusCodes.UNAUTHORIZED);
      return;
    }

    if (!roles.includes(req.user.roleName)) {
      sendError(res, 'You do not have permission to perform this action', StatusCodes.FORBIDDEN);
      return;
    }
     
    next();
  };
