import { randomUUID } from 'crypto';
import { config } from '../../config';
import { logger } from '../../config/logger';
import { connectionQueue } from './connection-queue.service';
import { connectionTracker } from './connection-tracker.service';

export type ActivityLogType =
  | 'session_start'
  | 'session_end'
  | 'audio_play'
  | 'poi_view'
  | 'tour_start'
  | 'app_open'
  | 'socket_connect'
  | 'socket_device_registered'
  | 'socket_disconnect';

export interface ActivityLogEntry {
  id: string;
  type: ActivityLogType;
  sessionId: string | null;
  userId: string | null;
  deviceInfo: string | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
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
  queuedSessions: ReturnType<typeof connectionQueue.getSnapshot>;
  sessionsLastHour: number;
  totalListensToday: number;
  recentActivities: ActivityLogEntry[];
  activeSessions: ReturnType<typeof connectionTracker.getActiveSessions>;
}

const LOG_BUFFER_SIZE = 500;
const activityLog: ActivityLogEntry[] = [];

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear();
};

export const activityLogger = {
  log(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): ActivityLogEntry {
    const activity = {
      ...entry,
      id: randomUUID(),
      timestamp: new Date(),
    };

    activityLog.push(activity);

    if (activityLog.length > LOG_BUFFER_SIZE) {
      activityLog.shift();
    }

    logger.info({ logType: 'activity', ...activity });
    return activity;
  },

  getRecent(limit = 50): ActivityLogEntry[] {
    return activityLog
      .slice(-limit)
      .reverse();
  },

  getStats(): MonitoringStats {
    const now = Date.now();
    const oneHourAgo = now - 3600_000;
    const concurrentUsers = connectionTracker.getConcurrentCount();
    const maxConcurrentSessions = config.monitoring.maxConcurrentSessions;
    const utilizationPercent = maxConcurrentSessions > 0
      ? Math.round((concurrentUsers / maxConcurrentSessions) * 100)
      : 0;
    const availableSlots = Math.max(maxConcurrentSessions - concurrentUsers, 0);

    return {
      concurrentUsers,
      maxConcurrentSessions,
      availableSlots,
      utilizationPercent,
      warningThresholdPercent: config.monitoring.warningThresholdPercent,
      isNearLimit: utilizationPercent >= config.monitoring.warningThresholdPercent,
      isAtCapacity: concurrentUsers >= maxConcurrentSessions,
      queuedDevices: connectionQueue.size(),
      queuedSessions: connectionQueue.getSnapshot(50),
      sessionsLastHour: activityLog.filter(
        (entry) => entry.type === 'session_start' && entry.timestamp.getTime() > oneHourAgo,
      ).length,
      totalListensToday: activityLog.filter(
        (entry) => entry.type === 'audio_play' && isToday(entry.timestamp),
      ).length,
      recentActivities: this.getRecent(100),
      activeSessions: connectionTracker.getActiveSessions(50),
    };
  },

  reset(): void {
    activityLog.length = 0;
    connectionQueue.reset();
  },
};
