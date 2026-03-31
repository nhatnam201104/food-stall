import { Router } from 'express';
import { prisma } from '../../config/database';
import { merchantAnalyticsService } from '../../services/merchant/analytics.service';
import { AppError } from '../../errors/app-error';
import { sendSuccess } from '../../utils/response.util';

const router = Router();

/** Get merchantId from authenticated userId */
const getMerchantId = async (userId: string): Promise<string> => {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) throw AppError.forbidden('Merchant profile not found');
  return merchant.id;
};

/**
 * @route   GET /api/merchant/analytics/summary
 * @desc    Get summary stats for merchant: total listens, avg listening time, completion rate, active POIs
 * @access  Private (Merchant only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/summary', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const merchantId = await getMerchantId(userId);
    const data = await merchantAnalyticsService.getOverview(merchantId, req);
    sendSuccess(res, data, 'Summary retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/merchant/analytics/overview
 * @desc    Get merchant dashboard overview statistics
 * @access  Private (Merchant only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/overview', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const merchantId = await getMerchantId(userId);
    const data = await merchantAnalyticsService.getOverview(merchantId, req);
    sendSuccess(res, data, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/merchant/analytics/top-pois
 * @desc    Get merchant's top performing POIs
 * @access  Private (Merchant only)
 * @query   limit - Number of POIs to return (default: 10, max: 50)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/top-pois', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const merchantId = await getMerchantId(userId);
    const data = await merchantAnalyticsService.getTopPois(merchantId, req.query as any);
    sendSuccess(res, data, 'Top POIs retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/merchant/analytics/history
 * @desc    Get interaction history for merchant's POIs
 * @access  Private (Merchant only)
 * @query   poiId - Filter by specific POI (optional)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 */
router.get('/history', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const merchantId = await getMerchantId(userId);
    const data = await merchantAnalyticsService.getInteractionHistory(merchantId, req.query as any);
    sendSuccess(res, data, 'Interaction history retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/merchant/analytics/pois/:poiId
 * @desc    Get analytics for a specific POI
 * @access  Private (Merchant only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/pois/:poiId', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const merchantId = await getMerchantId(userId);
    const data = await merchantAnalyticsService.getPoiAnalytics(
      merchantId,
      req.params.poiId,
      req.query as any,
    );
    sendSuccess(res, data, 'POI analytics retrieved successfully');
  } catch (error: any) {
    if (error.message === 'POI not found or access denied') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
});

export default router;
