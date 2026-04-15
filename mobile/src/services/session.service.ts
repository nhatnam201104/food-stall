import axiosInstance from "../configs/axios.config";
import type { ApiResponse } from "../types/api.types";
import type { TouristSession } from "../types/tourist.types";

interface SessionStartPayload {
  tourId?: string;
  deviceInfo?: string;
  offlineMode?: boolean;
  appVersion?: string;
}

interface SessionGpsPayload {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  speedMps?: number;
}

interface SessionAudioPayload {
  poiId: string;
  triggerType: "gps_enter" | "gps_proximity" | "qr_scan" | "manual";
  playDurationSeconds?: number;
  totalDurationSeconds?: number;
  completed?: boolean;
  stopReason?: string;
}

let _activeSessionId: string | null = null;

export const sessionService = {
  /** Store the active session ID after start() succeeds */
  setActiveSessionId: (id: string | null) => {
    _activeSessionId = id;
  },

  /** Retrieve the current active session ID (null if none) */
  getActiveSessionId: (): string | null => {
    return _activeSessionId;
  },

  start: (payload: SessionStartPayload) =>
    axiosInstance.post<ApiResponse<TouristSession>>(
      "/tourist/sessions/start",
      payload,
    ),

  pushGps: (sessionId: string, payload: SessionGpsPayload) =>
    axiosInstance.post<ApiResponse<null>>(
      `/tourist/sessions/${sessionId}/gps`,
      payload,
    ),

  pushAudioPlay: (sessionId: string, payload: SessionAudioPayload) =>
    axiosInstance.post<ApiResponse<null>>(
      `/tourist/sessions/${sessionId}/audio-play`,
      payload,
    ),

  end: (sessionId: string) =>
    axiosInstance.post<ApiResponse<TouristSession>>(
      `/tourist/sessions/${sessionId}/end`,
    ),
};
