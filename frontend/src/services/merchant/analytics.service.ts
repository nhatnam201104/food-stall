import axiosInstance from "../../configs/axios.config";
import type { ApiResponse } from "../../types";

// Interfaces matching backend response structure
export interface MerchantOverview {
  totalListens: number;
  avgListenDuration: number;
  completionRate: number;
  totalPOIs: number;
  activePOIs: number;
  topPOIs: MerchantTopPoi[];
}

export interface MerchantTopPoi {
  poiId: string;
  poiName: string;
  totalPlays: number;
  avgDuration: number | null;
  uniqueVisitors: number;
}

export interface InteractionHistory {
  interactions: InteractionHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InteractionHistoryItem {
  id: string;
  poiId: string;
  poiName: string;
  triggerType: string;
  triggeredAt: string;
  playDurationSeconds: number;
  completed: boolean;
  userName: string;
}

export const merchantAnalyticsService = {
  /**
   * Get merchant's overview statistics
   * @param params - Time filter { from?: 'today' | '7days' | '30days' }
   */
  async getOverview(params: { from?: string }) {
    const response = await axiosInstance.get<ApiResponse<MerchantOverview>>(
      `/merchant/analytics/overview`,
      { params },
    );
    return response.data;
  },

  /**
   * Get merchant's top performing POIs
   * @param params - Query params { limit?: number, from?: string, to?: string }
   */
  async getTopPois(params: { limit?: string; from?: string; to?: string }) {
    const response = await axiosInstance.get<
      ApiResponse<{ topPois: MerchantTopPoi[] }>
    >(`/merchant/analytics/top-pois`, { params });
    return response.data;
  },

  /**
   * Get interaction history for merchant's POIs
   * @param params - Query params { poiId?, from?, to?, page?, limit? }
   */
  async getInteractionHistory(params: {
    poiId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await axiosInstance.get<ApiResponse<InteractionHistory>>(
      `/merchant/analytics/history`,
      { params },
    );
    return response.data;
  },
};
