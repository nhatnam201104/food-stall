import { NextFunction, Request, Response } from 'express';
import { touristTourService } from '../../services/tourist/tour.service';
import { sendSuccess } from '../../utils/response.util';

export const touristTourController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tours, pagination } = await touristTourService.list(req);
      sendSuccess(res, tours, 'Tours retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tour = await touristTourService.getById(String(req.params['id'] ?? ''));
      sendSuccess(res, tour, 'Tour detail retrieved successfully');
    } catch (err) { next(err); }
  },
};
