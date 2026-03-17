import { Router } from 'express';
import { ttsController } from '../controllers/tts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/preview', authenticate, ttsController.preview);

export default router;
