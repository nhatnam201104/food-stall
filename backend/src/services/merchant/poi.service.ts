import { Prisma } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../../config/database";
import {
  POI_APPROVAL_STATUS,
  POI_AUDIO_MODE,
} from "../../constants/poi.constants";
import { AppError } from "../../errors/app-error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../utils/pagination.util";
import { generatePoiQrCode } from "../../utils/qr.util";

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
  audioUrl?: string | null;
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
      createdAt: "desc",
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
  payload: Pick<UpsertMerchantPoiInput, "ttsContent" | "audioUrl">,
): {
  ttsContent: string | null;
  audioUrl: string | null;
  languageCode: string;
} => {
  const payloadTts = normalizeNullableText(payload.ttsContent);
  const payloadAudioUrl = normalizeNullableText(payload.audioUrl);

  if (audioMode === POI_AUDIO_MODE.tts) {
    const nextTtsContent = payloadTts;

    if (!nextTtsContent) {
      throw AppError.badRequest("ttsContent is required when audioMode is tts");
    }

    return {
      ttsContent: nextTtsContent,
      audioUrl: null,
      languageCode: "vi",
    };
  }

  const nextAudioUrl = payloadAudioUrl;

  if (!nextAudioUrl) {
    throw AppError.badRequest("audioUrl is required when audioMode is file");
  }

  return {
    ttsContent: null,
    audioUrl: nextAudioUrl,
    languageCode: "vi",
  };
};

const getMerchantIdByUserId = async (userId: string): Promise<string> => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!merchant) {
    throw AppError.forbidden("Merchant profile not found for this account");
  }
  return merchant.id;
};

export const merchantPoiService = {
  async list(req: Request, userId: string) {
    const merchantId = await getMerchantIdByUserId(userId);
    const { page, limit, skip } = parsePagination(req);
    const {
      search,
      approvalStatus,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as {
      search?: string;
      approvalStatus?: string;
      isActive?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };

    const where: Prisma.PointOfInterestWhereInput = {
      merchantId,
      isDeleted: false,
      ...(approvalStatus ? { approvalStatus } : {}),
      ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
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
      sortBy === "name"
        ? { name: (sortOrder === "asc" ? "asc" : "desc") as Prisma.SortOrder }
        : {
            createdAt: (sortOrder === "asc"
              ? "asc"
              : "desc") as Prisma.SortOrder,
          };

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
        ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
      },
      select: MAP_SELECT,
      orderBy: { updatedAt: "desc" },
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
      throw AppError.notFound("POI not found");
    }

    return poi;
  },

  async create(
    userId: string,
    payload: Required<
      Pick<UpsertMerchantPoiInput, "name" | "latitude" | "longitude">
    > &
      UpsertMerchantPoiInput,
  ) {
    const merchantId = await getMerchantIdByUserId(userId);

    const audioMode = payload.audioMode ?? POI_AUDIO_MODE.tts;
    const audioState = resolveAudioState(audioMode, payload);

    const poi = await prisma.$transaction(async (tx) => {
      const createdPoi = await tx.pointOfInterest.create({
        data: {
          merchantId,
          name: payload.name,
          description: payload.description ?? null,
          address: payload.address?.trim() ?? "",
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

      await tx.poiAudio.create({
        data: {
          poiId: createdPoi.id,
          ttsContent: audioState.ttsContent,
          audioUrl: audioState.audioUrl,
          languageCode: audioState.languageCode,
          status: "active",
        },
      });

      const qrCodeUrl = await generatePoiQrCode(createdPoi.id);

      await tx.pointOfInterest.update({
        where: { id: createdPoi.id },
        data: { qrCodeUrl },
      });

      const detail = await tx.pointOfInterest.findUnique({
        where: { id: createdPoi.id },
        include: DETAIL_INCLUDE,
      });

      if (!detail) {
        throw AppError.notFound("Created POI not found");
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
        qrCodeUrl: true,
        latitude: true,
        longitude: true,
        audioMode: true,
        approvalStatus: true,
        poiAudio: {
          select: {
            ttsContent: true,
            audioUrl: true,
            languageCode: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!currentPoi) {
      throw AppError.notFound("POI not found");
    }

    const nextAudioMode = payload.audioMode ?? currentPoi.audioMode;
    const currentAudio = currentPoi.poiAudio[0] ?? null;
    const nextAudioPayload = {
      ttsContent:
        payload.ttsContent ??
        (nextAudioMode === POI_AUDIO_MODE.tts
          ? (currentAudio?.ttsContent ?? null)
          : null),
      audioUrl:
        payload.audioUrl ??
        (nextAudioMode === POI_AUDIO_MODE.file
          ? (currentAudio?.audioUrl ?? null)
          : null),
    };
    const nextAudio = resolveAudioState(nextAudioMode, nextAudioPayload);

    const poi = await prisma.$transaction(async (tx) => {
      await tx.pointOfInterest.update({
        where: { id: currentPoi.id },
        data: {
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.description !== undefined && {
            description: payload.description ?? null,
          }),
          ...(payload.address !== undefined && {
            address: payload.address.trim(),
          }),
          ...(payload.imageUrl !== undefined && {
            imageUrl: payload.imageUrl ?? null,
          }),
          ...(payload.latitude !== undefined && { latitude: payload.latitude }),
          ...(payload.longitude !== undefined && {
            longitude: payload.longitude,
          }),
          ...(payload.isActive !== undefined && { isActive: payload.isActive }),
          ...(payload.audioMode !== undefined && {
            audioMode: payload.audioMode,
          }),
        },
      });

      const existingAudio = await tx.poiAudio.findFirst({
        where: { poiId: currentPoi.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (existingAudio) {
        await tx.poiAudio.update({
          where: { id: existingAudio.id },
          data: {
            ttsContent: nextAudio.ttsContent,
            audioUrl: nextAudio.audioUrl,
            languageCode: nextAudio.languageCode,
            status: "active",
          },
        });
      } else {
        await tx.poiAudio.create({
          data: {
            poiId: currentPoi.id,
            languageCode: nextAudio.languageCode,
            ttsContent: nextAudio.ttsContent,
            audioUrl: nextAudio.audioUrl,
            status: "active",
          },
        });
      }

      const detail = await tx.pointOfInterest.findUnique({
        where: { id: currentPoi.id },
        include: DETAIL_INCLUDE,
      });

      if (!detail) {
        throw AppError.notFound("Updated POI not found");
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
      throw AppError.notFound("POI not found");
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
