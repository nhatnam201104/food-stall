import { Router } from 'express';
import authRoutes from './auth.routes';
import authOtpRoutes from './auth-otp.routes';
import adminRoutes from './admin/index';
import uploadRoutes from './upload.routes';
import merchantRoutes from './merchant/index';
import ttsRoutes from './tts.routes';
import touristRoutes from './tourist/index';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/otp', authOtpRoutes);
router.use('/admin', adminRoutes);
router.use('/merchant', merchantRoutes);
router.use('/tourist', touristRoutes);
router.use('/upload', uploadRoutes);
router.use('/tts', ttsRoutes);

export default router;
