import { Router } from 'express';
import { touristSessionController } from '../../controllers/tourist/session.controller';
import { concurrentLimit } from '../../middleware/concurrent-limit.middleware';
import { handleValidationErrors } from '../../middleware/validate.middleware';
import { uuidParamValidation } from '../../libs/validation/pagination.validation';
import {
  touristSessionStartValidation,
  touristSessionGpsValidation,
  touristSessionAudioPlayValidation,
} from '../../libs/validation/tourist/session.validation';

const router = Router();

router.post('/start', concurrentLimit, touristSessionStartValidation, handleValidationErrors, touristSessionController.start);
router.post('/:id/heartbeat', uuidParamValidation(), handleValidationErrors, touristSessionController.heartbeat);
router.post('/:id/gps', [...uuidParamValidation(), ...touristSessionGpsValidation], handleValidationErrors, touristSessionController.pushGps);
router.post('/:id/audio-play', [...uuidParamValidation(), ...touristSessionAudioPlayValidation], handleValidationErrors, touristSessionController.pushAudioPlay);
router.post('/:id/end', uuidParamValidation(), handleValidationErrors, touristSessionController.end);

export default router;
