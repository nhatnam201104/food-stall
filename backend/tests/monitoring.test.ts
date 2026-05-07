import assert from 'assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '../src/config';
import { concurrentLimit } from '../src/middleware/concurrent-limit.middleware';
import { activityLogger } from '../src/services/monitoring/activity-log.service';
import { connectionQueue } from '../src/services/monitoring/connection-queue.service';
import { connectionTracker } from '../src/services/monitoring/connection-tracker.service';

connectionTracker.reset();
activityLogger.reset();

const runConcurrentLimit = (body: Record<string, unknown> = {}) => {
  let nextCalled = false;
  let statusCode = 0;
  let jsonBody: unknown;
  const responseMock = {
    status(code: number) {
      statusCode = code;
      return responseMock;
    },
    json(body: unknown) {
      jsonBody = body;
      return responseMock;
    },
  };

  concurrentLimit(
    { body } as Request,
    responseMock as unknown as Response,
    (() => { nextCalled = true; }) as NextFunction,
  );

  return { nextCalled, statusCode, jsonBody };
};

assert.equal(connectionTracker.getConcurrentCount(), 0);

connectionTracker.track('session-a', null, 'ios test-device', {
  source: 'socket',
  socketId: 'socket-a',
  origin: 'https://public-backend.test',
  transport: 'websocket',
});
activityLogger.log({
  type: 'session_start',
  sessionId: 'session-a',
  userId: null,
  deviceInfo: 'ios test-device',
  metadata: {},
});

activityLogger.log({
  type: 'audio_play',
  sessionId: 'session-a',
  userId: null,
  deviceInfo: 'ios test-device',
  metadata: { poiId: 'poi-a', poiName: 'Test POI' },
});

let stats = activityLogger.getStats();
assert.equal(stats.concurrentUsers, 1);
assert.equal(stats.availableSlots, Math.max(stats.maxConcurrentSessions - 1, 0));
assert.equal(stats.queuedDevices, 0);
assert.equal(stats.sessionsLastHour, 1);
assert.equal(stats.totalListensToday, 1);
assert.equal(stats.recentActivities.length, 2);
assert.equal(stats.activeSessions.length, 1);
assert.equal(stats.activeSessions[0]?.source, 'socket');
assert.equal(stats.activeSessions[0]?.transport, 'websocket');

connectionTracker.touch('session-a');
connectionTracker.untrack('session-a');
activityLogger.log({
  type: 'session_end',
  sessionId: 'session-a',
  userId: null,
  deviceInfo: 'ios test-device',
  metadata: {},
});

stats = activityLogger.getStats();
assert.equal(stats.concurrentUsers, 0);
assert.equal(stats.recentActivities[0]?.type, 'session_end');

const queued = connectionQueue.enqueue('android queued-device');
stats = activityLogger.getStats();
assert.equal(stats.queuedDevices, 1);
assert.equal(stats.queuedSessions[0]?.queueId, queued.queueId);
assert.equal(stats.queuedSessions[0]?.position, 1);
connectionQueue.dequeue(queued.queueId);

const queuedWithCapacity = connectionQueue.enqueue('android queued-with-capacity');
let limitResult = runConcurrentLimit({
  deviceInfo: 'android queued-with-capacity',
  queueId: queuedWithCapacity.queueId,
});
assert.equal(limitResult.nextCalled, true);
assert.equal(connectionQueue.size(), 0);

connectionTracker.reset();
connectionQueue.reset();
for (let index = 0; index < config.monitoring.maxConcurrentSessions; index += 1) {
  connectionTracker.track(`full-session-${index}`, null, `device-${index}`);
}

limitResult = runConcurrentLimit({ deviceInfo: 'android overflow-device' });
assert.equal(limitResult.nextCalled, false);
assert.equal(limitResult.statusCode, StatusCodes.ACCEPTED);
const queuedResponse = limitResult.jsonBody as {
  data?: {
    queued?: boolean;
    availableSlots?: number;
    queuedDevices?: number;
  };
};
assert.equal(queuedResponse.data?.queued, true);
assert.equal(queuedResponse.data?.availableSlots, 0);
assert.equal(queuedResponse.data?.queuedDevices, 1);

connectionTracker.reset();
activityLogger.reset();

console.log('Monitoring test passed');
