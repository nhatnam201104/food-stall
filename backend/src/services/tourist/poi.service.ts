import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';

interface LatLng {
  latitude: number;
  longitude: number;
}

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

const haversineDistanceMeters = (a: LatLng, b: LatLng): number => {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const x = sinLat * sinLat + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return earthRadius * c;
};

const basePoiWhere: Prisma.PointOfInterestWhereInput = {
  isDeleted: false,
  isActive: true,
  approvalStatus: POI_APPROVAL_STATUS.approved,
};

const markerSelect = {
  id: true,
  name: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  radiusMeters: true,
  priority: true,
  cooldownSeconds: true,
} satisfies Prisma.PointOfInterestSelect;

export const touristPoiService = {
  async inView(req: Request) {
    const { page, limit, skip } = parsePagination(req);

    const minLat = Number(req.query['minLat']);
    const maxLat = Number(req.query['maxLat']);
    const minLng = Number(req.query['minLng']);
    const maxLng = Number(req.query['maxLng']);

    const where: Prisma.PointOfInterestWhereInput = {
      ...basePoiWhere,
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    };

    const [total, pois] = await Promise.all([
      prisma.pointOfInterest.count({ where }),
      prisma.pointOfInterest.findMany({
        where,
        select: markerSelect,
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    return { pois, pagination: buildPaginationMeta(total, page, limit) };
  },

  async nearby(req: Request) {
    const { page, limit } = parsePagination(req);

    const lat = Number(req.query['lat']);
    const lng = Number(req.query['lng']);
    const radius = Number(req.query['radius']);

    const latDelta = radius / 111320;
    const lngDelta = radius / (111320 * Math.max(Math.cos(toRadians(lat)), 0.1));

    const candidates = await prisma.pointOfInterest.findMany({
      where: {
        ...basePoiWhere,
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      select: markerSelect,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 500,
    });

    const enriched = candidates
      .map((poi) => {
        const distanceMeters = haversineDistanceMeters(
          { latitude: lat, longitude: lng },
          { latitude: Number(poi.latitude), longitude: Number(poi.longitude) },
        );

        return {
          ...poi,
          distanceMeters,
        };
      })
      .filter((poi) => poi.distanceMeters <= radius)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const total = enriched.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      pois: enriched.slice(start, end),
      pagination: buildPaginationMeta(total, page, limit),
    };
  },

  async getById(id: string) {
    const poi = await prisma.pointOfInterest.findFirst({
      where: { id, ...basePoiWhere },
      include: {
        merchant: {
          select: {
            id: true,
            shopName: true,
            address: true,
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
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!poi) throw AppError.notFound('POI not found');

    return poi;
  },
};
