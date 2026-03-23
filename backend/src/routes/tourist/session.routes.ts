import { Router } from 'express';
import { touristSessionController } from '../../controllers/tourist/session.controller';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { uuidParamValidation } from '../../libs/validation/pagination.validation';
import {
  touristSessionStartValidation,
  touristSessionGpsValidation,
  touristSessionAudioPlayValidation,
} from '../../libs/validation/tourist/session.validation';

const router = Router();

router.post('/start', touristSessionStartValidation, handleValidationErrors, touristSessionController.start);
router.post('/:id/gps', [...uuidParamValidation(), ...touristSessionGpsValidation], handleValidationErrors, touristSessionController.pushGps);
router.post('/:id/audio-play', [...uuidParamValidation(), ...touristSessionAudioPlayValidation], handleValidationErrors, touristSessionController.pushAudioPlay);
router.post('/:id/end', uuidParamValidation(), handleValidationErrors, touristSessionController.end);

export default router;
