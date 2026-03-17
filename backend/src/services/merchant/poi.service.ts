import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS, POI_AUDIO_MODE } from '../../constants/poi.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';
import { isWithinVinhKhanhBounds } from '../../utils/map-bound.util';

interface UpsertMerchantPoiInput {
  name?: string;
  description?: string | null;
  address?: string;
  imageUrl?: string | null;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  priority?: number;
  isActive?: boolean;
  audioMode?: string;
  ttsContent?: string | null;
  audioUrl?: string | null;
  cooldownSeconds?: number;
}

const MAP_SELECT = {
  id: true,
  name: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  approvalStatus: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.PointOfInterestSelect;

const DETAIL_INCLUDE = {
  merchant: {
    select: {
      id: true,
      shopName: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  },
  reviewer: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  poiAudio: {
    select: {
      id: true,
      languageCode: true,
      ttsContent: true,
      audioUrl: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} satisfies Prisma.PointOfInterestInclude;

const normalizeNullableText = (value?: string | null): string | null => {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

const resolveAudioState = (
  audioMode: string,
  payload: Pick<UpsertMerchantPoiInput, 'ttsContent' | 'audioUrl'>,
): { ttsContent: string | null; audioUrl: string | null; languageCode: string } => {
  const payloadTts = normalizeNullableText(payload.ttsContent);
  const payloadAudioUrl = normalizeNullableText(payload.audioUrl);

  if (audioMode === POI_AUDIO_MODE.tts) {
    const nextTtsContent = payloadTts;

    if (!nextTtsContent) {
      throw AppError.badRequest('ttsContent is required when audioMode is tts');
    }

    return {
      ttsContent: nextTtsContent,
      audioUrl: null,
      languageCode: 'vi',
    };
  }

  const nextAudioUrl = payloadAudioUrl;

  if (!nextAudioUrl) {
    throw AppError.badRequest('audioUrl is required when audioMode is file');
  }

  return {
    ttsContent: null,
    audioUrl: nextAudioUrl,
    languageCode: 'vi',
  };
};

const getMerchantIdByUserId = async (userId: string): Promise<string> => {
  const merchant = await prisma.merchant.findUnique({ where: { userId }, select: { id: true } });
  if (!merchant) {
    throw AppError.forbidden('Merchant profile not found for this account');
  }
  return merchant.id;
};

const assertCoordinatesInBounds = (latitude: number, longitude: number): void => {
  if (!isWithinVinhKhanhBounds(latitude, longitude)) {
    throw AppError.badRequest('Coordinates are out of the allowed Vinh Khanh, District 4 area');
  }
};

const hasMeaningfulPoiChanges = (
  currentPoi: {
    name: string;
    description: string | null;
    address: string | null;
    imageUrl: string | null;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
    radiusMeters: number;
    priority: number;
    audioMode: string;
    cooldownSeconds: number;
  },
  payload: UpsertMerchantPoiInput,
  nextAudio: { ttsContent: string | null; audioUrl: string | null; languageCode: string },
  currentAudio: { ttsContent: string | null; audioUrl: string | null; languageCode: string } | null,
): boolean => {
  if (payload.name !== undefined && payload.name !== currentPoi.name) return true;
  if (payload.description !== undefined && payload.description !== currentPoi.description) return true;
  if (payload.address !== undefined && payload.address !== currentPoi.address) return true;
  if (payload.imageUrl !== undefined && payload.imageUrl !== currentPoi.imageUrl) return true;
  if (payload.latitude !== undefined && Number(currentPoi.latitude) !== payload.latitude) return true;
  if (payload.longitude !== undefined && Number(currentPoi.longitude) !== payload.longitude) return true;
  if (payload.radiusMeters !== undefined && payload.radiusMeters !== currentPoi.radiusMeters) return true;
  if (payload.priority !== undefined && payload.priority !== currentPoi.priority) return true;
  if (payload.audioMode !== undefined && payload.audioMode !== currentPoi.audioMode) return true;
  if (payload.cooldownSeconds !== undefined && payload.cooldownSeconds !== currentPoi.cooldownSeconds) return true;
  if ((currentAudio?.ttsContent ?? null) !== nextAudio.ttsContent) return true;
  if ((currentAudio?.audioUrl ?? null) !== nextAudio.audioUrl) return true;
  if ((currentAudio?.languageCode ?? 'vi') !== nextAudio.languageCode) return true;
  return false;
};

export const merchantPoiService = {
  async list(req: Request, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);
    const { page, limit, skip } = parsePagination(req);
    const { search, approvalStatus, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as {
      search?: string;
      approvalStatus?: string;
      isActive?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const where: Prisma.PointOfInterestWhereInput = {
      merchantId,
      isDeleted: false,
      ...(approvalStatus ? { approvalStatus } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { address: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PointOfInterestOrderByWithRelationInput =
      sortBy === 'name'
        ? { name: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder }
        : { createdAt: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder };

    const [total, pois] = await Promise.all([
      prisma.pointOfInterest.count({ where }),
      prisma.pointOfInterest.findMany({
        where,
        include: DETAIL_INCLUDE,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return {
      pois,
      pagination: buildPaginationMeta(total, page, limit),
    };
  },

  async map(req: Request, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);
    const { approvalStatus, isActive } = req.query as {
      approvalStatus?: string;
      isActive?: string;
    };

    const markers = await prisma.pointOfInterest.findMany({
      where: {
        merchantId,
        isDeleted: false,
        ...(approvalStatus ? { approvalStatus } : {}),
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      },
      select: MAP_SELECT,
      orderBy: { updatedAt: 'desc' },
    });

    return markers;
  },

  async getById(id: string, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);

    const poi = await prisma.pointOfInterest.findFirst({
      where: {
        id,
        merchantId,
        isDeleted: false,
      },
      include: DETAIL_INCLUDE,
    });

    if (!poi) {
      throw AppError.notFound('POI not found');
    }

    return poi;
  },

  async create(userId: string, payload: Required<Pick<UpsertMerchantPoiInput, 'name' | 'latitude' | 'longitude'>> & UpsertMerchantPoiInput) {
    const merchantId = await getMerchantIdByUserId(userId);

    assertCoordinatesInBounds(payload.latitude, payload.longitude);

    const audioMode = payload.audioMode ?? POI_AUDIO_MODE.tts;
    const audioState = resolveAudioState(audioMode, payload);

    const poi = await prisma.$transaction(async (tx) => {
      const createdPoi = await tx.pointOfInterest.create({
        data: {
          merchantId,
          name: payload.name,
          description: payload.description ?? null,
          address: payload.address?.trim() ?? '',
          imageUrl: payload.imageUrl ?? null,
          latitude: payload.latitude,
          longitude: payload.longitude,
          radiusMeters: payload.radiusMeters ?? 15,
          priority: payload.priority ?? 1,
          isActive: payload.isActive ?? true,
          audioMode,
          cooldownSeconds: payload.cooldownSeconds ?? 30,
          approvalStatus: POI_APPROVAL_STATUS.pending,
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
        },
      });

      await tx.poiAudio.create({
        data: {
          poiId: createdPoi.id,
          ttsContent: audioState.ttsContent,
          audioUrl: audioState.audioUrl,
          languageCode: audioState.languageCode,
          status: 'active',
        },
      });

      const detail = await tx.pointOfInterest.findUnique({
        where: { id: createdPoi.id },
        include: DETAIL_INCLUDE,
      });

      if (!detail) {
        throw AppError.notFound('Created POI not found');
      }

      return detail;
    });

    return poi;
  },

  async update(id: string, userId: string, payload: UpsertMerchantPoiInput) {
    const merchantId = await getMerchantIdByUserId(userId);

    const currentPoi = await prisma.pointOfInterest.findFirst({
      where: {
        id,
        merchantId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
        priority: true,
        audioMode: true,
        cooldownSeconds: true,
        approvalStatus: true,
        poiAudio: {
          select: {
            ttsContent: true,
            audioUrl: true,
            languageCode: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!currentPoi) {
      throw AppError.notFound('POI not found');
    }

    const nextLatitude = payload.latitude ?? Number(currentPoi.latitude);
    const nextLongitude = payload.longitude ?? Number(currentPoi.longitude);
    assertCoordinatesInBounds(nextLatitude, nextLongitude);

    const nextAudioMode = payload.audioMode ?? currentPoi.audioMode;
    const currentAudio = currentPoi.poiAudio[0] ?? null;
    const nextAudioPayload = {
      ttsContent: payload.ttsContent ?? (nextAudioMode === POI_AUDIO_MODE.tts ? currentAudio?.ttsContent ?? null : null),
      audioUrl: payload.audioUrl ?? (nextAudioMode === POI_AUDIO_MODE.file ? currentAudio?.audioUrl ?? null : null),
    };
    const nextAudio = resolveAudioState(nextAudioMode, nextAudioPayload);

    const shouldResetApproval = currentPoi.approvalStatus === POI_APPROVAL_STATUS.approved
      && hasMeaningfulPoiChanges(currentPoi, payload, nextAudio, currentAudio);

    const poi = await prisma.$transaction(async (tx) => {
      await tx.pointOfInterest.update({
        where: { id: currentPoi.id },
        data: {
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.description !== undefined && { description: payload.description ?? null }),
          ...(payload.address !== undefined && { address: payload.address.trim() }),
          ...(payload.imageUrl !== undefined && { imageUrl: payload.imageUrl ?? null }),
          ...(payload.latitude !== undefined && { latitude: payload.latitude }),
          ...(payload.longitude !== undefined && { longitude: payload.longitude }),
          ...(payload.radiusMeters !== undefined && { radiusMeters: payload.radiusMeters }),
          ...(payload.priority !== undefined && { priority: payload.priority }),
          ...(payload.isActive !== undefined && { isActive: payload.isActive }),
          ...(payload.audioMode !== undefined && { audioMode: payload.audioMode }),
          ...(payload.cooldownSeconds !== undefined && { cooldownSeconds: payload.cooldownSeconds }),
          ...(shouldResetApproval
            ? {
                approvalStatus: POI_APPROVAL_STATUS.pending,
                reviewNote: null,
                reviewedAt: null,
                reviewedBy: null,
                submittedAt: new Date(),
              }
            : {}),
        },
      });

      const existingAudio = await tx.poiAudio.findFirst({
        where: { poiId: currentPoi.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (existingAudio) {
        await tx.poiAudio.update({
          where: { id: existingAudio.id },
          data: {
            ttsContent: nextAudio.ttsContent,
            audioUrl: nextAudio.audioUrl,
            languageCode: nextAudio.languageCode,
            status: 'active',
          },
        });
      } else {
        await tx.poiAudio.create({
          data: {
            poiId: currentPoi.id,
            languageCode: nextAudio.languageCode,
            ttsContent: nextAudio.ttsContent,
            audioUrl: nextAudio.audioUrl,
            status: 'active',
          },
        });
      }

      const detail = await tx.pointOfInterest.findUnique({
        where: { id: currentPoi.id },
        include: DETAIL_INCLUDE,
      });

      if (!detail) {
        throw AppError.notFound('Updated POI not found');
      }

      return detail;
    });

    return poi;
  },

  async remove(id: string, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);

    const poi = await prisma.pointOfInterest.findFirst({
      where: { id, merchantId, isDeleted: false },
      select: { id: true },
    });

    if (!poi) {
      throw AppError.notFound('POI not found');
    }

    await prisma.pointOfInterest.update({
      where: { id: poi.id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });
  },
};
