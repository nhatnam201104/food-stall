import { prisma } from '../../config/database';
import { broadcastToAdmins } from '../../config/socket';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { TOUR_STATUS } from '../../constants/tour.constants';
import { AppError } from '../../errors/app-error';
import { activityLogger } from '../monitoring/activity-log.service';
import { connectionTracker } from '../monitoring/connection-tracker.service';

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

interface SessionAudioPlayPayload {
  poiId: string;
  triggerType: 'gps_enter' | 'gps_proximity' | 'qr_scan' | 'manual';
  playDurationSeconds?: number;
  totalDurationSeconds?: number;
  completed?: boolean;
  stopReason?: string;
}

const assertSessionAccess = async (sessionId: string, userId: string | null) => {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw AppError.notFound('Session not found');
  }

  if (session.userId && session.userId !== userId) {
    throw AppError.notFound('Session not found');
  }

  return session;
};

export const touristSessionService = {
  async start(userId: string | null, payload: SessionStartPayload) {
    if (payload.tourId) {
      const tour = await prisma.tour.findFirst({
        where: {
          id: payload.tourId,
          isDeleted: false,
          status: TOUR_STATUS.active,
        },
        select: { id: true },
      });

      if (!tour) {
        throw AppError.badRequest('Tour is invalid or inactive');
      }
    }

    const session = await prisma.userSession.create({
      data: {
        userId,
        tourId: payload.tourId,
        deviceInfo: payload.deviceInfo,
      },
    });

    connectionTracker.track(session.id, userId, payload.deviceInfo);
    activityLogger.log({
      type: 'session_start',
      sessionId: session.id,
      userId,
      deviceInfo: payload.deviceInfo ?? null,
      metadata: {
        tourId: payload.tourId ?? null,
        offlineMode: payload.offlineMode ?? false,
        appVersion: payload.appVersion ?? null,
      },
    });
    broadcastToAdmins('stats:update', activityLogger.getStats());

    return session;
  },

  async heartbeat(sessionId: string, userId: string | null) {
    const session = await assertSessionAccess(sessionId, userId);

    if (session.endedAt) {
      throw AppError.badRequest('Session already ended');
    }

    connectionTracker.track(session.id, session.userId, session.deviceInfo);
    broadcastToAdmins('stats:update', activityLogger.getStats());

    return {
      sessionId: session.id,
      concurrentUsers: connectionTracker.getConcurrentCount(),
    };
  },

  async pushGps(_sessionId: string, _userId: string | null, _payload: SessionGpsPayload) {
    // GPS tracking has been removed - no-op.
  },

  async pushAudioPlay(sessionId: string, userId: string | null, payload: SessionAudioPlayPayload) {
    const session = await assertSessionAccess(sessionId, userId);

    if (session.endedAt) {
      throw AppError.badRequest('Session already ended');
    }

    const poi = await prisma.pointOfInterest.findFirst({
      where: {
        id: payload.poiId,
        isDeleted: false,
        isActive: true,
        approvalStatus: POI_APPROVAL_STATUS.approved,
      },
      select: { id: true, name: true },
    });

    if (!poi) {
      throw AppError.badRequest('POI is invalid or inactive');
    }

    await prisma.audioPlayHistory.create({
      data: {
        sessionId,
        poiId: payload.poiId,
        triggerType: payload.triggerType,
        playDurationSeconds: payload.playDurationSeconds,
        totalDurationSeconds: payload.totalDurationSeconds,
        completed: payload.completed ?? false,
        stopReason: payload.stopReason,
      },
    });

    const activity = activityLogger.log({
      type: 'audio_play',
      sessionId,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      metadata: {
        poiId: poi.id,
        poiName: poi.name,
        triggerType: payload.triggerType,
        playDurationSeconds: payload.playDurationSeconds ?? null,
        totalDurationSeconds: payload.totalDurationSeconds ?? null,
        completed: payload.completed ?? false,
      },
    });

    connectionTracker.touch(sessionId);
    broadcastToAdmins('stats:update', activityLogger.getStats());
    broadcastToAdmins('activity:new', activity);
  },

  async end(sessionId: string, userId: string | null) {
    const session = await assertSessionAccess(sessionId, userId);

    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    connectionTracker.untrack(sessionId);
    activityLogger.log({
      type: 'session_end',
      sessionId,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      metadata: {},
    });
    broadcastToAdmins('stats:update', activityLogger.getStats());

    return updatedSession;
  },
};
