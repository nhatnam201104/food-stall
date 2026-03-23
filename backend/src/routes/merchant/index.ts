import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import analyticsRoutes from './analytics.routes';
import merchantPoiRoutes from './poi.routes';

const router = Router();

router.use(authenticate, authorize('merchant'));
router.use('/analytics', analyticsRoutes);
router.use('/pois', merchantPoiRoutes);

export default router;
