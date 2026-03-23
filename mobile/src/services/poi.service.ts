import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';
import type { PoiDetail, PoiMarker } from '../types/tourist.types';

interface InViewQuery {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  page?: number;
  limit?: number;
}

interface NearbyQuery {
  lat: number;
  lng: number;
  radius: number;
  page?: number;
  limit?: number;
}

type RawPoiMarker = Omit<PoiMarker, 'latitude' | 'longitude' | 'radiusMeters' | 'priority' | 'cooldownSeconds' | 'distanceMeters'> & {
  latitude: number | string;
  longitude: number | string;
  radiusMeters: number | string;
  priority: number | string;
  cooldownSeconds: number | string;
  distanceMeters?: number | string;
};

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePoi = (poi: RawPoiMarker): PoiMarker => ({
  ...poi,
  latitude: toNumber(poi.latitude),
  longitude: toNumber(poi.longitude),
  radiusMeters: toNumber(poi.radiusMeters),
  priority: toNumber(poi.priority),
  cooldownSeconds: toNumber(poi.cooldownSeconds),
  distanceMeters: poi.distanceMeters !== undefined ? toNumber(poi.distanceMeters) : undefined,
});

export const poiService = {
  inView: async (query: InViewQuery) => {
    const res = await axiosInstance.get<ApiResponse<RawPoiMarker[]>>('/tourist/pois/in-view', { params: query });
    const data = (res.data.data || []).map(normalizePoi);
    return {
      ...res,
      data: {
        ...res.data,
        data,
      },
    };
  },

  nearby: async (query: NearbyQuery) => {
    const res = await axiosInstance.get<ApiResponse<RawPoiMarker[]>>('/tourist/pois/nearby', { params: query });
    const data = (res.data.data || []).map(normalizePoi);
    return {
      ...res,
      data: {
        ...res.data,
        data,
      },
    };
  },

  detail: async (id: string) => {
    const res = await axiosInstance.get<ApiResponse<PoiDetail & RawPoiMarker>>(`/tourist/pois/${id}`);
    const raw = res.data.data;

    return {
      ...res,
      data: {
        ...res.data,
        data: raw ? ({
          ...raw,
          latitude: toNumber(raw.latitude),
          longitude: toNumber(raw.longitude),
          radiusMeters: toNumber(raw.radiusMeters),
          priority: toNumber(raw.priority),
          cooldownSeconds: toNumber(raw.cooldownSeconds),
        } as PoiDetail) : undefined,
      },
    };
  },
};
