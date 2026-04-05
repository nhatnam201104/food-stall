import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.post('/public-image', authLimiter, upload.single('image'), uploadController.uploadImage);
router.post('/image', authenticate, upload.single('image'), uploadController.uploadImage);

export default router;
