import axiosInstance from "../configs/axios.config";
import type { ApiResponse } from "../types/api.types";
import type { PoiDetail, PoiMarker } from "../types/tourist.types";
import { useLanguageStore } from "../stores/languageStore";

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

type RawPoiMarker = Omit<
  PoiMarker,
  | "latitude"
  | "longitude"
  | "radiusMeters"
  | "priority"
  | "cooldownSeconds"
  | "distanceMeters"
> & {
  latitude: number | string;
  longitude: number | string;
  radiusMeters: number | string;
  priority: number | string;
  cooldownSeconds: number | string;
  distanceMeters?: number | string;
};

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return value;
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
  distanceMeters:
    poi.distanceMeters !== undefined ? toNumber(poi.distanceMeters) : undefined,
});

export const poiService = {
  listAll: async (page = 1, limit = 200) => {
    const res = await axiosInstance.get<ApiResponse<RawPoiMarker[]>>(
      "/tourist/pois/all",
      { params: { page, limit } },
    );
    const data = (res.data.data || []).map(normalizePoi);
    return { ...res, data: { ...res.data, data } };
  },

  inView: async (query: InViewQuery) => {
    const res = await axiosInstance.get<ApiResponse<RawPoiMarker[]>>(
      "/tourist/pois/in-view",
      { params: query },
    );
    const data = (res.data.data || []).map(normalizePoi);
    return { ...res, data: { ...res.data, data } };
  },

  nearby: async (query: NearbyQuery) => {
    const res = await axiosInstance.get<ApiResponse<RawPoiMarker[]>>(
      "/tourist/pois/nearby",
      { params: query },
    );
    const data = (res.data.data || []).map(normalizePoi);
    return { ...res, data: { ...res.data, data } };
  },

  /** Increment POI priority by 1 (called when user listens to full TTS) */
  incrementPriority: async (id: string): Promise<void> => {
    await axiosInstance.patch(`/tourist/pois/${id}/increment-priority`);
  },

  detail: async (id: string) => {
    const appLanguage = useLanguageStore.getState().appLanguage;
    const res = await axiosInstance.get<ApiResponse<PoiDetail & RawPoiMarker>>(
      `/tourist/pois/${id}`,
      { params: { lang: appLanguage } },
    );
    const raw = res.data.data;
    return {
      ...res,
      data: {
        ...res.data,
        data: raw
          ? ({
              ...raw,
              latitude: toNumber(raw.latitude),
              longitude: toNumber(raw.longitude),
              radiusMeters: toNumber(raw.radiusMeters),
              priority: toNumber(raw.priority),
              cooldownSeconds: toNumber(raw.cooldownSeconds),
            } as PoiDetail)
          : undefined,
      },
    };
  },
};
