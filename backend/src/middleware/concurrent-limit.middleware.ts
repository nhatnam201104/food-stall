import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '../config';
import { connectionQueue } from '../services/monitoring/connection-queue.service';
import { connectionTracker } from '../services/monitoring/connection-tracker.service';
import { sendSuccess } from '../utils/response.util';

const RETRY_AFTER_SECONDS = 10;

const sendQueued = (req: Request, res: Response): void => {
  const queueEntry = connectionQueue.enqueue(req.body?.deviceInfo, req.body?.queueId);
  const position = connectionQueue.getPosition(queueEntry.queueId) ?? 1;
  const concurrentUsers = connectionTracker.getConcurrentCount();
  const availableSlots = Math.max(config.monitoring.maxConcurrentSessions - concurrentUsers, 0);

  sendSuccess(
    res,
    {
      queued: true,
      queueId: queueEntry.queueId,
      position,
      queuedDevices: connectionQueue.size(),
      retryAfterSeconds: RETRY_AFTER_SECONDS,
      concurrentUsers,
      maxConcurrentSessions: config.monitoring.maxConcurrentSessions,
      availableSlots,
    },
    'Server at full capacity. Device added to queue.',
    StatusCodes.ACCEPTED,
  );
};

export const concurrentLimit = (req: Request, res: Response, next: NextFunction): void => {
  const concurrentUsers = connectionTracker.getConcurrentCount();
  const hasCapacity = concurrentUsers < config.monitoring.maxConcurrentSessions;
  const queueId = typeof req.body?.queueId === 'string' ? req.body.queueId : null;

  if (!hasCapacity) {
    sendQueued(req, res);
    return;
  }

  if (queueId) {
    connectionQueue.dequeue(queueId);
  }

  next();
};
