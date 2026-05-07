import { io, type Socket } from 'socket.io-client';
import apiClient from '../../configs/axios.config';
import type { ApiResponse } from '../../types';

export type MonitoringActivityType =
  | 'session_start'
  | 'session_end'
  | 'audio_play'
  | 'poi_view'
  | 'tour_start'
  | 'app_open'
  | 'socket_connect'
  | 'socket_device_registered'
  | 'socket_disconnect';

export interface MonitoringActivity {
  id: string;
  type: MonitoringActivityType;
  sessionId: string | null;
  userId: string | null;
  deviceInfo: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface ActiveMonitoringSession {
  sessionId: string;
  userId: string | null;
  deviceInfo: string | null;
  source: 'rest' | 'socket';
  socketId: string | null;
  origin: string | null;
  transport: string | null;
  connectedAt: string;
  lastActivity: string;
}

export interface QueuedMonitoringSession {
  queueId: string;
  deviceInfo: string | null;
  requestedAt: string;
  lastSeenAt: string;
  position: number;
}

export interface MonitoringStats {
  concurrentUsers: number;
  maxConcurrentSessions: number;
  availableSlots: number;
  utilizationPercent: number;
  warningThresholdPercent: number;
  isNearLimit: boolean;
  isAtCapacity: boolean;
  queuedDevices: number;
  queuedSessions: QueuedMonitoringSession[];
  sessionsLastHour: number;
  totalListensToday: number;
  recentActivities: MonitoringActivity[];
  activeSessions: ActiveMonitoringSession[];
}

type StatsListener = (stats: MonitoringStats) => void;
type ActivityListener = (activity: MonitoringActivity) => void;
type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type StatusListener = (status: SocketStatus) => void;

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;

  const apiBase = String(import.meta.env.VITE_API_URL || apiClient.defaults.baseURL || '');
  if (apiBase) {
    return apiBase.replace(/\/api\/v1\/?$/, '');
  }

  return window.location.origin;
};

class MonitoringService {
  private socket: Socket | null = null;
  private statsListeners = new Set<StatsListener>();
  private activityListeners = new Set<ActivityListener>();
  private statusListeners = new Set<StatusListener>();
  private status: SocketStatus = 'idle';

  private setStatus(status: SocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  async getStats(): Promise<ApiResponse<MonitoringStats>> {
    const response = await apiClient.get('/admin/monitoring/stats');
    return response.data;
  }

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('auth_token');

    this.setStatus('connecting');
    this.socket = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
    });

    this.socket.on('connect', () => {
      this.setStatus('connected');
      this.socket?.emit('admin:join');
    });

    this.socket.on('disconnect', () => {
      this.setStatus('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.setStatus('error');
    });

    this.socket.on('stats:update', (data: MonitoringStats) => {
      this.statsListeners.forEach((listener) => listener(data));
    });

    this.socket.on('activity:new', (data: MonitoringActivity) => {
      this.activityListeners.forEach((listener) => listener(data));
    });
  }

  onStatsUpdate(listener: StatsListener): () => void {
    this.statsListeners.add(listener);
    return () => this.statsListeners.delete(listener);
  }

  onActivity(listener: ActivityListener): () => void {
    this.activityListeners.add(listener);
    return () => this.activityListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('disconnected');
    this.statsListeners.clear();
    this.activityListeners.clear();
    this.statusListeners.clear();
  }
}

export const monitoringService = new MonitoringService();
