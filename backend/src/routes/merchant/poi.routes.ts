import { Router } from 'express';
import { merchantPoiController } from '../../controllers/merchant/poi.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { paginationValidation, uuidParamValidation } from '../../libs/validation/pagination.validation';
import {
  createMerchantPoiValidation,
  merchantPoiListValidation,
  updateMerchantPoiValidation,
} from '../../libs/validation/merchant/poi.validation';

const router = Router();

router.get('/', [...paginationValidation, ...merchantPoiListValidation], handleValidationErrors, merchantPoiController.list);
router.get('/map', merchantPoiListValidation, handleValidationErrors, merchantPoiController.map);
router.get('/:id', uuidParamValidation(), handleValidationErrors, merchantPoiController.getById);
router.post('/', createMerchantPoiValidation, handleValidationErrors, merchantPoiController.create);
router.post('/:id/resubmit', uuidParamValidation(), handleValidationErrors, merchantPoiController.resubmit);
router.put('/:id', [...uuidParamValidation(), ...updateMerchantPoiValidation], handleValidationErrors, merchantPoiController.update);
router.delete('/:id', uuidParamValidation(), handleValidationErrors, merchantPoiController.remove);

export default router;
