import { Router } from "express";
import { touristPoiController } from "../../controllers/tourist/poi.controller";
import { handleValidationErrors } from "../../middleware/validate.middleware";
import {
  paginationValidation,
  uuidParamValidation,
} from "../../libs/validation/pagination.validation";
import {
  touristPoiInViewValidation,
  touristPoiNearbyValidation,
} from "../../libs/validation/tourist/poi.validation";

const router = Router();

router.get(
  "/all",
  [...paginationValidation],
  handleValidationErrors,
  touristPoiController.listAll,
);
router.get(
  "/in-view",
  [...paginationValidation, ...touristPoiInViewValidation],
  handleValidationErrors,
  touristPoiController.inView,
);
router.get(
  "/nearby",
  [...paginationValidation, ...touristPoiNearbyValidation],
  handleValidationErrors,
  touristPoiController.nearby,
);
router.patch(
  "/:id/increment-priority",
  uuidParamValidation(),
  handleValidationErrors,
  touristPoiController.incrementPriority,
);

router.get(
  "/:id",
  uuidParamValidation(),
  handleValidationErrors,
  touristPoiController.getById,
);

export default router;
