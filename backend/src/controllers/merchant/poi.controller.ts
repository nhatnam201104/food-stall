import { NextFunction, Request, Response } from 'express';
import { merchantPoiService } from '../../services/merchant/poi.service';
import { sendCreated, sendSuccess } from '../../utils/response.util';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
};

const getId = (req: Request): string => String(req.params['id'] ?? '');
const getUserId = (req: AuthenticatedRequest): string => String(req.user?.userId ?? '');

export const merchantPoiController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await merchantPoiService.list(req, getUserId(req as AuthenticatedRequest));
      sendSuccess(res, pois, 'POIs retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async map(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pois = await merchantPoiService.map(req, getUserId(req as AuthenticatedRequest));
      sendSuccess(res, pois, 'POI map data retrieved successfully');
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await merchantPoiService.getById(getId(req), getUserId(req as AuthenticatedRequest));
      sendSuccess(res, poi, 'POI detail retrieved successfully');
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await merchantPoiService.create(getUserId(req as AuthenticatedRequest), req.body);
      sendCreated(res, poi, 'POI created successfully and submitted for review');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await merchantPoiService.update(getId(req), getUserId(req as AuthenticatedRequest), req.body);
      sendSuccess(res, poi, 'POI updated successfully');
    } catch (err) { next(err); }
  },

  async resubmit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await merchantPoiService.resubmit(getId(req), getUserId(req as AuthenticatedRequest));
      sendSuccess(res, poi, 'POI resubmitted for review successfully');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await merchantPoiService.remove(getId(req), getUserId(req as AuthenticatedRequest));
      sendSuccess(res, null, 'POI deleted successfully');
    } catch (err) { next(err); }
  },
};
