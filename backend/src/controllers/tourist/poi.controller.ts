import { NextFunction, Request, Response } from "express";
import { touristPoiService } from "../../services/tourist/poi.service";
import { sendSuccess } from "../../utils/response.util";

export const touristPoiController = {
  async listAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { pois, pagination } = await touristPoiService.listAll(req);
      sendSuccess(
        res,
        pois,
        "All active POIs retrieved successfully",
        200,
        pagination,
      );
    } catch (err) {
      next(err);
    }
  },

  async inView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await touristPoiService.inView(req);
      sendSuccess(
        res,
        pois,
        "POI map data retrieved successfully",
        200,
        pagination,
      );
    } catch (err) {
      next(err);
    }
  },

  async nearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pois, pagination } = await touristPoiService.nearby(req);
      sendSuccess(
        res,
        pois,
        "Nearby POIs retrieved successfully",
        200,
        pagination,
      );
    } catch (err) {
      next(err);
    }
  },

  async incrementPriority(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params["id"] ?? "");
      await touristPoiService.incrementPriority(id);
      sendSuccess(res, null, "POI priority incremented successfully");
    } catch (err) {
      next(err);
    }
  },

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params["id"] ?? "");
      const lang =
        typeof req.query["lang"] === "string" ? req.query["lang"] : undefined;
      const poi = await touristPoiService.getById(id, lang);
      sendSuccess(res, poi, "POI detail retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};
