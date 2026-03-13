import type { AnalyticsSummary, TopPoiMetric } from '../types';

export const mockAdminSummary: AnalyticsSummary = {
  totalUsers: 128,
  totalMerchants: 26,
  totalPois: 74,
  totalTours: 12,
  totalListens: 8420,
  totalInteractions: 10930,
  averageListeningTime: 86,
  activePois: 62,
};

export const mockMerchantSummary: AnalyticsSummary = {
  totalUsers: 0,
  totalMerchants: 1,
  totalPois: 8,
  totalTours: 0,
  totalListens: 1230,
  totalInteractions: 1980,
  averageListeningTime: 91,
  activePois: 6,
};

export const mockTopPois: TopPoiMetric[] = [
  { poiId: 'poi-1', poiName: 'Main Entrance Booth', totalPlays: 480, averageListeningSeconds: 93 },
  { poiId: 'poi-2', poiName: 'Menu Counter', totalPlays: 350, averageListeningSeconds: 88 },
  { poiId: 'poi-3', poiName: 'Outdoor Seating', totalPlays: 220, averageListeningSeconds: 67 },
];
