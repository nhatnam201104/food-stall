import { randomUUID } from 'crypto';

export interface QueuedConnection {
  queueId: string;
  deviceInfo: string | null;
  requestedAt: Date;
  lastSeenAt: Date;
}

const QUEUE_ENTRY_TTL_MS = 35_000;
const CLEANUP_INTERVAL_MS = 10_000;
const queuedConnections = new Map<string, QueuedConnection>();

const cleanupQueue = (): void => {
  const staleBefore = Date.now() - QUEUE_ENTRY_TTL_MS;

  for (const [queueId, entry] of queuedConnections) {
    if (entry.lastSeenAt.getTime() < staleBefore) {
      queuedConnections.delete(queueId);
    }
  }
};

const cleanupInterval = setInterval(cleanupQueue, CLEANUP_INTERVAL_MS);
cleanupInterval.unref?.();

const getOrderedQueue = (): QueuedConnection[] => {
  cleanupQueue();
  return Array.from(queuedConnections.values())
    .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
};

export const connectionQueue = {
  enqueue(deviceInfo?: string | null, queueId?: string | null): QueuedConnection {
    cleanupQueue();

    if (queueId && queuedConnections.has(queueId)) {
      const existing = queuedConnections.get(queueId)!;
      existing.lastSeenAt = new Date();
      existing.deviceInfo = deviceInfo ?? existing.deviceInfo;
      return existing;
    }

    const entry: QueuedConnection = {
      queueId: randomUUID(),
      deviceInfo: deviceInfo ?? null,
      requestedAt: new Date(),
      lastSeenAt: new Date(),
    };

    queuedConnections.set(entry.queueId, entry);
    return entry;
  },

  dequeue(queueId: string): void {
    queuedConnections.delete(queueId);
  },

  getPosition(queueId: string): number | null {
    const queue = getOrderedQueue();
    const index = queue.findIndex((entry) => entry.queueId === queueId);
    return index === -1 ? null : index + 1;
  },

  isFirst(queueId: string): boolean {
    return this.getPosition(queueId) === 1;
  },

  size(): number {
    cleanupQueue();
    return queuedConnections.size;
  },

  getSnapshot(limit = 50): Array<QueuedConnection & { position: number }> {
    return getOrderedQueue()
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        position: index + 1,
      }));
  },

  reset(): void {
    queuedConnections.clear();
  },
};
