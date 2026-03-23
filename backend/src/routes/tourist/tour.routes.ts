import { Router } from 'express';
import { touristTourController } from '../../controllers/tourist/tour.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { paginationValidation, uuidParamValidation } from '../../libs/validation/pagination.validation';
import { touristTourListValidation } from '../../libs/validation/tourist/tour.validation';

const router = Router();

router.get('/', [...paginationValidation, ...touristTourListValidation], handleValidationErrors, touristTourController.list);
router.get('/:id', uuidParamValidation(), handleValidationErrors, touristTourController.getById);

export default router;
