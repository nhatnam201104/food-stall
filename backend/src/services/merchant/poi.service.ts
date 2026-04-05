import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS, POI_AUDIO_MODE } from '../../constants/poi.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';
import { isWithinVinhKhanhBounds } from '../../utils/map-bound.util';
import { generatePoiQrCode } from '../../utils/qr.util';
import { ttsService } from '../tts.service';
import { deletePoiAudioFileByUrl, savePoiAudioBuffer } from '../../utils/poi-audio-file.util';

interface UpsertMerchantPoiInput {
  name?: string;
  description?: string | null;
  address?: string;
  imageUrl?: string | null;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  audioMode?: string;
  ttsContent?: string | null;
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

const resolveTtsContent = (value?: string | null): string => {
  const normalized = normalizeNullableText(value);
  if (!normalized) {
    throw AppError.badRequest('ttsContent is required');
  }
  return normalized;
};

const generatePersistedAudio = async (
  poiId: string,
  ttsContent: string,
  languageCode: string,
): Promise<{ ttsContent: string; languageCode: string; audioUrl: string; fileSizeBytes: bigint; status: string }> => {
  const audioBuffer = await ttsService.generatePreviewAudio(ttsContent, languageCode, 'vi');
  const saved = savePoiAudioBuffer(audioBuffer, poiId, languageCode);
  return {
    ttsContent,
    languageCode,
    audioUrl: saved.audioUrl,
    fileSizeBytes: saved.fileSizeBytes,
    status: 'active',
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

    const ttsContent = resolveTtsContent(payload.ttsContent);
    const audioMode = POI_AUDIO_MODE.tts;

    let createdPoiId: string | null = null;
    let generatedAudioUrl: string | null = null;

    try {
      const createdPoi = await prisma.pointOfInterest.create({
        data: {
          merchantId,
          name: payload.name,
          description: payload.description ?? null,
          address: payload.address?.trim() ?? '',
          imageUrl: payload.imageUrl ?? null,
          latitude: payload.latitude,
          longitude: payload.longitude,
          isActive: payload.isActive ?? true,
          audioMode,
          approvalStatus: POI_APPROVAL_STATUS.pending,
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
        },
      });

      createdPoiId = createdPoi.id;

      const persistedAudio = await generatePersistedAudio(createdPoi.id, ttsContent, 'en');
      generatedAudioUrl = persistedAudio.audioUrl;
      const qrCodeUrl = await generatePoiQrCode(createdPoi.id);

      await prisma.$transaction(async (tx) => {
        await tx.poiAudio.create({
          data: {
            poiId: createdPoi.id,
            ttsContent: persistedAudio.ttsContent,
            audioUrl: persistedAudio.audioUrl,
            fileSizeBytes: persistedAudio.fileSizeBytes,
            languageCode: persistedAudio.languageCode,
            status: persistedAudio.status,
          },
        });

        await tx.pointOfInterest.update({
          where: { id: createdPoi.id },
          data: { qrCodeUrl },
        });
      });

      const detail = await prisma.pointOfInterest.findUnique({
        where: { id: createdPoi.id },
        include: DETAIL_INCLUDE,
      });

      if (!detail) {
        throw AppError.notFound('Created POI not found');
      }

      return detail;
    } catch (error) {
      if (generatedAudioUrl) {
        deletePoiAudioFileByUrl(generatedAudioUrl);
      }

      if (createdPoiId) {
        await prisma.pointOfInterest.delete({ where: { id: createdPoiId } }).catch(() => undefined);
      }

      throw error;
    }
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
        qrCodeUrl: true,
        latitude: true,
        longitude: true,
        audioMode: true,
        approvalStatus: true,
        poiAudio: {
          select: {
            ttsContent: true,
            audioUrl: true,
            status: true,
            id: true,
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

    const nextAudioMode = POI_AUDIO_MODE.tts;
    const currentAudio = currentPoi.poiAudio[0] ?? null;
    const nextTtsContent = resolveTtsContent(payload.ttsContent ?? currentAudio?.ttsContent ?? null);
    const hasTtsContentChanged = (currentAudio?.ttsContent || '').trim() !== nextTtsContent;

    const existingAudios = await prisma.poiAudio.findMany({
      where: { poiId: currentPoi.id },
      select: { audioUrl: true },
    });

    const shouldRegenerate = hasTtsContentChanged || existingAudios.length === 0 || currentPoi.audioMode === POI_AUDIO_MODE.file;
    let persistedAudio: Awaited<ReturnType<typeof generatePersistedAudio>> | null = null;

    try {
      if (shouldRegenerate) {
        persistedAudio = await generatePersistedAudio(currentPoi.id, nextTtsContent, 'en');
      }

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
            ...(payload.isActive !== undefined && { isActive: payload.isActive }),
            audioMode: nextAudioMode,
          },
        });

        if (shouldRegenerate && persistedAudio) {
          await tx.poiAudio.deleteMany({ where: { poiId: currentPoi.id } });

          await tx.poiAudio.create({
            data: {
              poiId: currentPoi.id,
              languageCode: persistedAudio.languageCode,
              ttsContent: persistedAudio.ttsContent,
              audioUrl: persistedAudio.audioUrl,
              fileSizeBytes: persistedAudio.fileSizeBytes,
              status: persistedAudio.status,
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

      if (shouldRegenerate) {
        for (const item of existingAudios) {
          deletePoiAudioFileByUrl(item.audioUrl);
        }
      }

      return poi;
    } catch (error) {
      if (persistedAudio?.audioUrl) {
        deletePoiAudioFileByUrl(persistedAudio.audioUrl);
      }
      throw error;
    }
  },

  async resubmit(id: string, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);

    const poi = await prisma.pointOfInterest.findFirst({
      where: {
        id,
        merchantId,
        isDeleted: false,
      },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (!poi) {
      throw AppError.notFound('POI not found');
    }

    if (poi.approvalStatus !== POI_APPROVAL_STATUS.rejected) {
      throw AppError.badRequest('Only rejected POIs can be resubmitted');
    }

    const updated = await prisma.pointOfInterest.update({
      where: { id: poi.id },
      data: {
        approvalStatus: POI_APPROVAL_STATUS.pending,
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
        submittedAt: new Date(),
      },
      include: DETAIL_INCLUDE,
    });

    return updated;
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

    const existingAudios = await prisma.poiAudio.findMany({
      where: { poiId: poi.id },
      select: { audioUrl: true },
    });

    for (const item of existingAudios) {
      deletePoiAudioFileByUrl(item.audioUrl);
    }

    await prisma.poiAudio.deleteMany({ where: { poiId: poi.id } });

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