export interface PoiMarker {
  id: string;
  name: string;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  cooldownSeconds: number;
  distanceMeters?: number;
}

export interface PoiDetail extends PoiMarker {
  description?: string | null;
  merchant?: {
    id: string;
    shopName: string;
    address?: string | null;
  };
  poiAudio?: Array<{
    id: string;
    languageCode: string;
    ttsContent?: string | null;
    audioUrl?: string | null;
    status: string;
    createdAt: string;
  }>;
}

export interface TourListItem {
  id: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  estimatedDurationMinutes?: number | null;
  createdAt: string;
  _count: {
    tourPois: number;
  };
}

export interface TourDetail {
  id: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  estimatedDurationMinutes?: number | null;
  tourPois: Array<{
    id: string;
    sequenceOrder: number;
    isMandatory: boolean;
    poi: {
      id: string;
      name: string;
      description?: string | null;
      imageUrl?: string | null;
      latitude: number;
      longitude: number;
      radiusMeters: number;
      priority: number;
    };
  }>;
}

export interface TouristSession {
  id: string;
  userId: string;
  tourId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  deviceInfo?: string | null;
  offlineMode: boolean;
  appVersion?: string | null;
}
