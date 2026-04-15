import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { TOUR_STATUS } from '../../constants/tour.constants';
import { AppError } from '../../errors/app-error';

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

const assertSessionOwnership = async (sessionId: string, userId: string) => {
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw AppError.notFound('Session not found');
  }

  return session;
};

export const touristSessionService = {
  async start(userId: string, payload: SessionStartPayload) {
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

    return prisma.userSession.create({
      data: {
        userId,
        tourId: payload.tourId,
        deviceInfo: payload.deviceInfo,
      },
    });
  },

  async pushGps(_sessionId: string, _userId: string, _payload: SessionGpsPayload) {
    // GPS tracking has been removed — no-op.
  },

  async pushAudioPlay(sessionId: string, userId: string, payload: SessionAudioPlayPayload) {
    const session = await assertSessionOwnership(sessionId, userId);

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
      select: { id: true },
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
  },

  async end(sessionId: string, userId: string) {
    await assertSessionOwnership(sessionId, userId);

    return prisma.userSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  },
};
