import apiClient from '../../configs/axios.config';
import type { ApiResponse } from '../../types';

export interface AdminOverview {
  totalUsers: number;
  totalMerchants: number;
  totalPOIs: number;
  totalTours: number;
  totalListens: number;
  totalSessions: number;
  avgListenDuration: number;
  totalListenDuration: number;
  recentActivities: Array<{
    id: string;
    poiName: string;
    triggerType: string;
    triggeredAt: string;
    userName: string;
  }>;
}

export interface TopPoi {
  poiId: string;
  poiName: string;
  merchantName: string | null;
  totalPlays: number;
  avgDuration: number | null;
  completionRate: number | null;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  density: number;
}

export interface HeatmapData {
  heatmap: HeatmapPoint[];
  totalPoints: number;
}

export interface RouteTrack {
  sessionId: string;
  userName: string;
  startedAt: string;
  tracks: Array<{
    latitude: number;
    longitude: number;
    recordedAt: string;
  }>;
}

export interface RouteTrackingData {
  routes: RouteTrack[];
  totalSessions: number;
}

export interface TriggerBreakdown {
  type: string;
  count: number;
}

export interface SummaryAnalytics {
  totalListens: number;
  avgListenDuration: number;
  totalListenDuration: number;
  triggerBreakdown: TriggerBreakdown[];
}

interface AnalyticsQuery {
  limit?: string;
  from?: 'today' | '7days' | '30days' | string;
  to?: string;
  userId?: string;
}

const analyticsService = {
  /**
   * Get admin dashboard overview statistics
   */
  getOverview: async (): Promise<ApiResponse<AdminOverview>> => {
    const response = await apiClient.get('/admin/analytics/overview');
    return response.data;
  },

  /**
   * Get top performing POIs
   */
  getTopPois: async (params?: AnalyticsQuery): Promise<ApiResponse<{ topPois: TopPoi[] }>> => {
    const response = await apiClient.get('/admin/analytics/top-pois', { params });
    return response.data;
  },

  /**
   * Get heatmap data for GPS tracks
   */
  getHeatmapData: async (params?: { from?: string; to?: string }): Promise<ApiResponse<HeatmapData>> => {
    const response = await apiClient.get('/admin/analytics/heatmap', { params });
    return response.data;
  },

  /**
   * Get route tracking data for sessions
   */
  getRouteTracking: async (params?: AnalyticsQuery): Promise<ApiResponse<RouteTrackingData>> => {
    const response = await apiClient.get('/admin/analytics/routes', { params });
    return response.data;
  },

  /**
   * Get summary analytics for admin overview
   */
  getSummaryAnalytics: async (params?: { from?: string; to?: string }): Promise<ApiResponse<SummaryAnalytics>> => {
    const response = await apiClient.get('/admin/analytics/summary', { params });
    return response.data;
  },
};

export default analyticsService;
