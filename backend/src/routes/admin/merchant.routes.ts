import { Router } from 'express';
import { merchantController } from '../../controllers/admin/merchant.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
  merchantListValidation,
  createMerchantValidation,
  updateMerchantValidation,
  merchantStatusValidation,
} from '../../libs/validation/admin/merchant.validation';
import { paginationValidation, uuidParamValidation } from '../../libs/validation/pagination.validation';

const router = Router();

router.get('/', [...paginationValidation, ...merchantListValidation], handleValidationErrors, merchantController.list);
router.get('/:id', uuidParamValidation(), handleValidationErrors, merchantController.getById);
router.post('/', createMerchantValidation, handleValidationErrors, merchantController.create);
router.put('/:id', [...uuidParamValidation(), ...updateMerchantValidation], handleValidationErrors, merchantController.update);
router.delete('/:id', uuidParamValidation(), handleValidationErrors, merchantController.remove);
router.patch('/:id/status', [...uuidParamValidation(), ...merchantStatusValidation], handleValidationErrors, merchantController.updateStatus);
router.post('/:id/upload-logo', uuidParamValidation(), handleValidationErrors, upload.single('logo'), merchantController.uploadLogo);

export default router;
