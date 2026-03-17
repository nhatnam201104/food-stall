import { Router } from 'express';
import { adminTourController } from '../../controllers/admin/tour.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { paginationValidation, uuidParamValidation } from '../../libs/validation/pagination.validation';
import {
  adminTourListValidation,
  createTourValidation,
  routePreviewValidation,
  replaceTourPoisValidation,
  updateTourValidation,
} from '../../libs/validation/admin/tour.validation';

const router = Router();

router.get('/', [...paginationValidation, ...adminTourListValidation], handleValidationErrors, adminTourController.list);
router.post('/route-preview', routePreviewValidation, handleValidationErrors, adminTourController.routePreview);
router.get('/:id', uuidParamValidation(), handleValidationErrors, adminTourController.getById);
router.post('/', createTourValidation, handleValidationErrors, adminTourController.create);
router.put('/:id', [...uuidParamValidation(), ...updateTourValidation], handleValidationErrors, adminTourController.update);
router.put('/:id/pois', [...uuidParamValidation(), ...replaceTourPoisValidation], handleValidationErrors, adminTourController.replacePois);
router.delete('/:id', uuidParamValidation(), handleValidationErrors, adminTourController.remove);

export default router;
