export type PoiAudioMode = 'tts' | 'file';
export type PoiLanguageCode = 'vi' | 'en' | 'zh' | 'ja' | 'ko';
export type PoiStatus = 'active' | 'inactive';
export type PoiApprovalStatus = 'pending' | 'approved' | 'rejected';
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
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  shopName: string;
  address?: string | null;
  contactEmail?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    isActive: boolean;
    createdAt: string;
  };
  _count?: { pointsOfInterest: number };
}

export interface PointOfInterest {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  qrCodeUrl?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  isActive: boolean;
  approvalStatus: PoiApprovalStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  audioMode: PoiAudioMode;
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
  merchant?: {
    id: string;
    shopName: string;
    address?: string | null;
    contactEmail?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    createdAt?: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      avatarUrl?: string | null;
      isActive?: boolean;
      createdAt?: string;
    };
  };
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  poiAudio?: Array<{
    id: string;
    languageCode: PoiLanguageCode;
    ttsContent?: string | null;
    audioUrl?: string | null;
    status: string;
    createdAt: string;
  }>;
}

export interface Tour {
  id: string;
  createdBy: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status: TourStatus;
  estimatedDurationMinutes?: number | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tourPois: number };
}

export interface TourPoi {
  id: string;
  tourId: string;
  poiId: string;
  sequenceOrder: number;
  isMandatory: boolean;
  poi?: PointOfInterest;
}

export interface AudioPlayHistory {
  id: string;
  sessionId: string;
  poiId: string;
  triggeredAt: string;
  triggerType: InteractionType;
  playDurationSeconds?: number | null;
  totalDurationSeconds?: number | null;
  completed: boolean;
  stopReason?: 'completed' | 'moved_too_fast' | 'notification' | 'manual' | 'new_poi' | null;
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
