import { NextFunction, Request, Response } from "express";
import { touristTourService } from "../../services/tourist/tour.service";
import { routingService } from "../../services/tourist/routing.service";
import { sendSuccess } from "../../utils/response.util";

export const touristTourController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tours, pagination } = await touristTourService.list(req);
      sendSuccess(res, tours, "Tours retrieved successfully", 200, pagination);
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
      const tour = await touristTourService.getById(
        String(req.params["id"] ?? ""),
      );
      sendSuccess(res, tour, "Tour detail retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getRoute(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { waypoints } = req.body as {
        waypoints: Array<{ latitude: number; longitude: number }>;
      };

      if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
        res
          .status(400)
          .json({ success: false, message: "At least 2 waypoints required" });
        return;
      }

      const result = await routingService.getRoute(waypoints);
      sendSuccess(res, result, "Route retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};
