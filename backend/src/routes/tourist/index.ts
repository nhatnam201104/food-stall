import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import touristPoiRoutes from './poi.routes';
import touristTourRoutes from './tour.routes';
import touristSessionRoutes from './session.routes';

const router = Router();

router.use(authenticate, authorize('tourist'));
router.use('/pois', touristPoiRoutes);
router.use('/tours', touristTourRoutes);
router.use('/sessions', touristSessionRoutes);

export default router;
