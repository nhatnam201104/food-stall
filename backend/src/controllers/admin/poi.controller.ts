import { NextFunction, Request, Response } from 'express';
import { adminPoiService } from '../../services/admin/poi.service';
import { sendSuccess } from '../../utils/response.util';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
};

const getId = (req: Request): string => String(req.params['id'] ?? '');
const getAdminUserId = (req: AuthenticatedRequest): string => String(req.user?.userId ?? '');

export const adminPoiController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await adminPoiService.list(req);
      sendSuccess(res, pois, 'POIs retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async map(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pois = await adminPoiService.map(req);
      sendSuccess(res, pois, 'POI map data retrieved successfully');
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await adminPoiService.getById(getId(req));
      sendSuccess(res, poi, 'POI detail retrieved successfully');
    } catch (err) { next(err); }
  },

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await adminPoiService.approve(getId(req), getAdminUserId(req as AuthenticatedRequest), req.body.reviewNote);
      sendSuccess(res, poi, 'POI approved successfully');
    } catch (err) { next(err); }
  },

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await adminPoiService.reject(getId(req), getAdminUserId(req as AuthenticatedRequest), req.body.reviewNote);
      sendSuccess(res, poi, 'POI rejected successfully');
    } catch (err) { next(err); }
  },

  async updateActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await adminPoiService.updateActive(getId(req), Boolean(req.body.isActive));
      sendSuccess(res, poi, 'POI active status updated successfully');
    } catch (err) { next(err); }
  },
};
