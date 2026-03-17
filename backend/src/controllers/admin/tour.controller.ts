import { NextFunction, Request, Response } from 'express';
import { adminTourService } from '../../services/admin/tour.service';
import { sendCreated, sendSuccess } from '../../utils/response.util';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
};

const getId = (req: Request): string => String(req.params['id'] ?? '');
const getAdminUserId = (req: AuthenticatedRequest): string => String(req.user?.userId ?? '');

export const adminTourController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tours, pagination } = await adminTourService.list(req);
      sendSuccess(res, tours, 'Tours retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tour = await adminTourService.getById(getId(req));
      sendSuccess(res, tour, 'Tour detail retrieved successfully');
    } catch (err) { next(err); }
  },

  async routePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const route = await adminTourService.routePreview(req.body);
      sendSuccess(res, route, 'Tour route preview generated successfully');
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tour = await adminTourService.create(req.body, getAdminUserId(req as AuthenticatedRequest));
      sendCreated(res, tour, 'Tour created successfully');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tour = await adminTourService.update(getId(req), req.body);
      sendSuccess(res, tour, 'Tour updated successfully');
    } catch (err) { next(err); }
  },

  async replacePois(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tour = await adminTourService.replacePois(getId(req), req.body.pois);
      sendSuccess(res, tour, 'Tour POIs updated successfully');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminTourService.remove(getId(req));
      sendSuccess(res, null, 'Tour deleted successfully');
    } catch (err) { next(err); }
  },
};
