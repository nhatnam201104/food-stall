export interface ActiveConnection {
  sessionId: string;
  userId: string | null;
  deviceInfo: string | null;
  source: 'rest' | 'socket';
  socketId: string | null;
  origin: string | null;
  transport: string | null;
  connectedAt: Date;
  lastActivity: Date;
}

interface ConnectionMetadata {
  source?: 'rest' | 'socket';
  socketId?: string | null;
  origin?: string | null;
  transport?: string | null;
}

const STALE_CONNECTION_MS = 45_000;
const CLEANUP_INTERVAL_MS = 15_000;

const activeConnections = new Map<string, ActiveConnection>();

const cleanupStaleConnections = (): void => {
  const staleBefore = Date.now() - STALE_CONNECTION_MS;

  for (const [sessionId, connection] of activeConnections) {
    if (connection.lastActivity.getTime() < staleBefore) {
      activeConnections.delete(sessionId);
    }
  }
};

const cleanupInterval = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL_MS);
cleanupInterval.unref?.();

export const connectionTracker = {
  track(
    sessionId: string,
    userId: string | null,
    deviceInfo?: string | null,
    metadata: ConnectionMetadata = {},
  ): number {
    const existing = activeConnections.get(sessionId);

    activeConnections.set(sessionId, {
      sessionId,
      userId,
      deviceInfo: deviceInfo ?? existing?.deviceInfo ?? null,
      source: metadata.source ?? existing?.source ?? 'rest',
      socketId: metadata.socketId ?? existing?.socketId ?? null,
      origin: metadata.origin ?? existing?.origin ?? null,
      transport: metadata.transport ?? existing?.transport ?? null,
      connectedAt: existing?.connectedAt ?? new Date(),
      lastActivity: new Date(),
    });

    return activeConnections.size;
  },

  untrack(sessionId: string): number {
    activeConnections.delete(sessionId);
    return activeConnections.size;
  },

  touch(sessionId: string, metadata: ConnectionMetadata = {}): number {
    const connection = activeConnections.get(sessionId);

    if (connection) {
      connection.lastActivity = new Date();
      connection.source = metadata.source ?? connection.source;
      connection.socketId = metadata.socketId ?? connection.socketId;
      connection.origin = metadata.origin ?? connection.origin;
      connection.transport = metadata.transport ?? connection.transport;
    }

    return activeConnections.size;
  },

  getConcurrentCount(): number {
    cleanupStaleConnections();
    return activeConnections.size;
  },

  getActiveSessions(limit = 50): ActiveConnection[] {
    cleanupStaleConnections();
    return Array.from(activeConnections.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      .slice(0, limit);
  },

  reset(): void {
    activeConnections.clear();
  },
};
