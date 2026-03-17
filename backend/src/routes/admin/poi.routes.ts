import { Router } from 'express';
import { adminPoiController } from '../../controllers/admin/poi.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { paginationValidation, uuidParamValidation } from '../../libs/validation/pagination.validation';
import {
  adminPoiActiveValidation,
  adminPoiListValidation,
  approvePoiValidation,
  rejectPoiValidation,
} from '../../libs/validation/admin/poi.validation';

const router = Router();

router.get('/', [...paginationValidation, ...adminPoiListValidation], handleValidationErrors, adminPoiController.list);
router.get('/map', adminPoiListValidation, handleValidationErrors, adminPoiController.map);
router.get('/:id', uuidParamValidation(), handleValidationErrors, adminPoiController.getById);
router.patch('/:id/approve', [...uuidParamValidation(), ...approvePoiValidation], handleValidationErrors, adminPoiController.approve);
router.patch('/:id/reject', [...uuidParamValidation(), ...rejectPoiValidation], handleValidationErrors, adminPoiController.reject);
router.patch('/:id/active', [...uuidParamValidation(), ...adminPoiActiveValidation], handleValidationErrors, adminPoiController.updateActive);

export default router;
