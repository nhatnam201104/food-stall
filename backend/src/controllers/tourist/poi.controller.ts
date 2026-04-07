import { NextFunction, Request, Response } from 'express';
import { touristPoiService } from '../../services/tourist/poi.service';
import { sendSuccess } from '../../utils/response.util';

export const touristPoiController = {
  async inView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await touristPoiService.inView(req);
      sendSuccess(res, pois, 'POI map data retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async nearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await touristPoiService.nearby(req);
      sendSuccess(res, pois, 'Nearby POIs retrieved successfully', 200, pagination);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poi = await touristPoiService.getById(String(req.params['id'] ?? ''));
      sendSuccess(res, poi, 'POI detail retrieved successfully');
    } catch (err) { next(err); }
  },
};
