import { NextFunction, Request, Response } from 'express';
import { touristSessionService } from '../../services/tourist/session.service';
import { sendCreated, sendSuccess } from '../../utils/response.util';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
};

const getUserId = (req: AuthenticatedRequest): string => String(req.user?.userId ?? '');
const getSessionId = (req: Request): string => String(req.params['id'] ?? '');

export const touristSessionController = {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await touristSessionService.start(getUserId(req as AuthenticatedRequest), req.body);
      sendCreated(res, session, 'Session started successfully');
    } catch (err) { next(err); }
  },

  async pushGps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await touristSessionService.pushGps(getSessionId(req), getUserId(req as AuthenticatedRequest), req.body);
      sendSuccess(res, null, 'GPS track recorded successfully');
    } catch (err) { next(err); }
  },

  async pushAudioPlay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await touristSessionService.pushAudioPlay(getSessionId(req), getUserId(req as AuthenticatedRequest), req.body);
      sendSuccess(res, null, 'Audio play history recorded successfully');
    } catch (err) { next(err); }
  },

  async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await touristSessionService.end(getSessionId(req), getUserId(req as AuthenticatedRequest));
      sendSuccess(res, session, 'Session ended successfully');
    } catch (err) { next(err); }
  },
};
