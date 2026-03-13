export type MerchantStatus = 'active' | 'suspended' | 'pending';
export type PoiAudioMode = 'tts' | 'file';
export type PoiStatus = 'active' | 'inactive';
export type TourStatus = 'active' | 'draft' | 'archived';
export type InteractionType = 'gps_enter' | 'gps_proximity' | 'qr_scan';

export interface Role {
  id: string;
  name: 'tourist' | 'merchant' | 'admin';
  description?: string;
}

export interface User {
  id: string;
  roleId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  shopName: string;
  address?: string;
  contactEmail?: string;
  status: MerchantStatus;
  createdAt: string;
}

export interface PointOfInterest {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  isActive: boolean;
  audioMode: PoiAudioMode;
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  createdBy: string;
  name: string;
  description?: string;
  status: TourStatus;
  estimatedDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TourPoi {
  id: string;
  tourId: string;
  poiId: string;
  sequenceOrder: number;
  isMandatory: boolean;
}

export interface AudioPlayHistory {
  id: string;
  sessionId: string;
  poiId: string;
  triggeredAt: string;
  triggerType: InteractionType;
  playDurationSeconds: number;
  totalDurationSeconds: number;
  completed: boolean;
  stopReason: 'completed' | 'moved_too_fast' | 'notification' | 'manual' | 'new_poi';
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalMerchants: number;
  totalPois: number;
  totalTours: number;
  totalListens: number;
  totalInteractions: number;
  averageListeningTime: number;
  activePois: number;
}

export interface TopPoiMetric {
  poiId: string;
  poiName: string;
  totalPlays: number;
  averageListeningSeconds: number;
}
