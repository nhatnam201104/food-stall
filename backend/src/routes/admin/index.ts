import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import analyticsRoutes from './analytics.routes';
import merchantRoutes from './merchant.routes';
import poiRoutes from './poi.routes';
import tourRoutes from './tour.routes';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));
router.use('/analytics', analyticsRoutes);
router.use('/merchants', merchantRoutes);
router.use('/pois', poiRoutes);
router.use('/tours', tourRoutes);

export default router;
