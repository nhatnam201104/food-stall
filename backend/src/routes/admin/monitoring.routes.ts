import { Router } from 'express';
import { activityLogger } from '../../services/monitoring/activity-log.service';
import { sendSuccess } from '../../utils/response.util';

const router = Router();

router.get('/stats', (_req, res) => {
  sendSuccess(res, activityLogger.getStats(), 'Monitoring stats retrieved successfully');
});

export default router;
