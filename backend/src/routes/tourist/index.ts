import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.middleware';
import touristPoiRoutes from './poi.routes';
import touristTourRoutes from './tour.routes';
import touristSessionRoutes from './session.routes';

const router = Router();

router.use(optionalAuth);
router.use('/pois', touristPoiRoutes);
router.use('/tours', touristTourRoutes);
router.use('/sessions', touristSessionRoutes);

export default router;
