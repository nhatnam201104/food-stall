export interface PoiMarker {
  id: string;
  name: string;
  imageUrl?: string | null;
  category?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  priority: number;
  cooldownSeconds: number;
  distanceMeters?: number;
}

export interface PoiDetail extends PoiMarker {
  description?: string | null;
  /** Backend-translated content based on requested lang param */
  translatedContent?: string | null;
  /** Language code of the translated/returned content (ISO 639-1) */
  detectedLanguage?: string;
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
  userId: string | null;
  tourId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  deviceInfo?: string | null;
  offlineMode: boolean;
  appVersion?: string | null;
}
