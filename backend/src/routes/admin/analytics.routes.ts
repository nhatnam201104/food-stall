import { Router } from 'express';
import { adminAnalyticsService } from '../../services/admin/analytics.service';
import { sendSuccess } from '../../utils/response.util';

const router = Router();

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get admin dashboard overview statistics
 * @access  Private (Admin only)
 */
router.get('/overview', async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getOverview();
    sendSuccess(res, data, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/analytics/top-pois
 * @desc    Get top performing POIs
 * @access  Private (Admin only)
 * @query   limit - Number of POIs to return (default: 10, max: 100)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/top-pois', async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getTopPois(req);
    console.log('Top POIs data:', data); // Debug log
    sendSuccess(res, data, 'Top POIs retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/analytics/heatmap
 * @desc    Get heatmap data for GPS tracks
 * @access  Private (Admin only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/heatmap', async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getHeatmapData(req);
    sendSuccess(res, data, 'Heatmap data retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/analytics/routes
 * @desc    Get route tracking data for sessions
 * @access  Private (Admin only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 * @query   userId - Filter by specific user
 * @query   limit - Number of sessions to return (default: 50, max: 200)
 */
router.get('/routes', async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getRouteTracking(req);
    sendSuccess(res, data, 'Route tracking data retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/analytics/summary
 * @desc    Get summary analytics for admin overview
 * @access  Private (Admin only)
 * @query   from - Date filter: 'today', '7days', '30days', or ISO date
 * @query   to - End date filter (ISO date)
 */
router.get('/summary', async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getSummaryAnalytics(req);
    sendSuccess(res, data, 'Summary analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
