import axiosInstance from "../configs/axios.config";
import type { ApiResponse } from "../types/api.types";
import type { TouristSession } from "../types/tourist.types";

interface SessionStartPayload {
  tourId?: string;
  deviceInfo?: string;
  offlineMode?: boolean;
  appVersion?: string;
  queueId?: string;
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

export interface QueuedSessionStart {
  queued: true;
  queueId: string;
  position: number;
  queuedDevices: number;
  retryAfterSeconds: number;
  concurrentUsers: number;
  maxConcurrentSessions: number;
  availableSlots: number;
}

export const isQueuedSessionStart = (
  value: TouristSession | QueuedSessionStart | undefined,
): value is QueuedSessionStart => {
  return Boolean(value && "queued" in value && value.queued);
};

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
    axiosInstance.post<ApiResponse<TouristSession | QueuedSessionStart>>(
      "/tourist/sessions/start",
      payload,
    ),

  pushGps: (sessionId: string, payload: SessionGpsPayload) =>
    axiosInstance.post<ApiResponse<null>>(
      `/tourist/sessions/${sessionId}/gps`,
      payload,
    ),

  heartbeat: (sessionId: string) =>
    axiosInstance.post<ApiResponse<{ sessionId: string; concurrentUsers: number }>>(
      `/tourist/sessions/${sessionId}/heartbeat`,
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
