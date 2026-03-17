import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { TOUR_STATUS } from '../../constants/tour.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';

interface TourPoiInput {
  poiId: string;
  isMandatory?: boolean;
}

interface RouteWaypointInput {
  latitude: number;
  longitude: number;
}

interface RoutePreviewInput {
  mode: 'walking' | 'driving';
  waypoints: RouteWaypointInput[];
}

interface TourUpsertInput {
  name?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status?: string;
  estimatedDurationMinutes?: number | null;
  pois?: TourPoiInput[];
}

const ensureValidTourPois = async (pois: TourPoiInput[]): Promise<void> => {
  if (pois.length < 2) {
    throw AppError.badRequest('Tour must include at least 2 POIs');
  }

  const uniquePoiIds = new Set(pois.map((item) => item.poiId));
  if (uniquePoiIds.size !== pois.length) {
    throw AppError.badRequest('Duplicate POI is not allowed in a tour');
  }

  const validPois = await prisma.pointOfInterest.count({
    where: {
      id: { in: Array.from(uniquePoiIds) },
      isDeleted: false,
      isActive: true,
      approvalStatus: POI_APPROVAL_STATUS.approved,
    },
  });

  if (validPois !== uniquePoiIds.size) {
    throw AppError.badRequest('All POIs in a tour must be approved, active, and not deleted');
  }
};

const buildTourPoiRows = (tourId: string, pois: TourPoiInput[]) =>
  pois.map((item, index) => ({
    tourId,
    poiId: item.poiId,
    sequenceOrder: index + 1,
    isMandatory: item.isMandatory ?? false,
  }));

const mapRouteModeToOsrmProfile = (mode: 'walking' | 'driving'): 'foot' | 'driving' =>
  (mode === 'walking' ? 'foot' : 'driving');

const buildOsrmRouteUrl = (input: RoutePreviewInput): string => {
  const profile = mapRouteModeToOsrmProfile(input.mode);
  const path = input.waypoints
    .map((item) => `${item.longitude},${item.latitude}`)
    .join(';');

  return `https://router.project-osrm.org/route/v1/${profile}/${path}?overview=full&geometries=geojson&steps=false`;
};

export const adminTourService = {
  async list(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as {
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const where: Prisma.TourWhereInput = {
      isDeleted: false,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TourOrderByWithRelationInput =
      sortBy === 'name'
        ? { name: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder }
        : { createdAt: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder };

    const [total, tours] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: { tourPois: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return { tours, pagination: buildPaginationMeta(total, page, limit) };
  },

  async getById(id: string) {
    const tour = await prisma.tour.findFirst({
      where: { id, isDeleted: false },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        tourPois: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            poi: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                latitude: true,
                longitude: true,
                isActive: true,
                approvalStatus: true,
                merchant: {
                  select: {
                    id: true,
                    shopName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tour) throw AppError.notFound('Tour not found');
    return tour;
  },

  async routePreview(payload: RoutePreviewInput) {
    if (!Array.isArray(payload.waypoints) || payload.waypoints.length < 2) {
      throw AppError.badRequest('Route preview requires at least 2 waypoints');
    }

    const routeUrl = buildOsrmRouteUrl(payload);
    const response = await fetch(routeUrl);
    if (!response.ok) {
      throw AppError.badRequest('Unable to generate route preview at the moment');
    }

    type OsrmResponse = {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: {
          coordinates?: Array<[number, number]>;
        };
      }>;
    };

    const data = await response.json() as OsrmResponse;
    const bestRoute = data.routes?.[0];
    const coordinates = bestRoute?.geometry?.coordinates || [];

    if (!coordinates.length) {
      throw AppError.badRequest('No route found for selected waypoints');
    }

    const routePath = coordinates.map((point) => [point[1], point[0]] as [number, number]);

    return {
      mode: payload.mode,
      provider: 'osrm',
      distanceMeters: bestRoute?.distance ?? 0,
      durationSeconds: bestRoute?.duration ?? 0,
      routePath,
    };
  },

  async create(payload: Required<Pick<TourUpsertInput, 'name' | 'pois'>> & TourUpsertInput, adminUserId: string) {
    await ensureValidTourPois(payload.pois);

    const tour = await prisma.$transaction(async (tx) => {
      const createdTour = await tx.tour.create({
        data: {
          createdBy: adminUserId,
          name: payload.name,
          description: payload.description ?? null,
          coverImageUrl: payload.coverImageUrl ?? null,
          status: payload.status ?? TOUR_STATUS.active,
          estimatedDurationMinutes: payload.estimatedDurationMinutes ?? null,
        },
      });

      await tx.tourPoi.createMany({
        data: buildTourPoiRows(createdTour.id, payload.pois),
      });

      return createdTour;
    });

    return this.getById(tour.id);
  },

  async update(id: string, payload: TourUpsertInput) {
    const tour = await prisma.tour.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!tour) throw AppError.notFound('Tour not found');

    if (payload.pois) {
      await ensureValidTourPois(payload.pois);
    }

    await prisma.$transaction(async (tx) => {
      await tx.tour.update({
        where: { id },
        data: {
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.description !== undefined && { description: payload.description ?? null }),
          ...(payload.coverImageUrl !== undefined && { coverImageUrl: payload.coverImageUrl ?? null }),
          ...(payload.status !== undefined && { status: payload.status }),
          ...(payload.estimatedDurationMinutes !== undefined && { estimatedDurationMinutes: payload.estimatedDurationMinutes }),
        },
      });

      if (payload.pois) {
        await tx.tourPoi.deleteMany({ where: { tourId: id } });
        await tx.tourPoi.createMany({ data: buildTourPoiRows(id, payload.pois) });
      }
    });

    return this.getById(id);
  },

  async replacePois(id: string, pois: TourPoiInput[]) {
    const tour = await prisma.tour.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!tour) throw AppError.notFound('Tour not found');

    await ensureValidTourPois(pois);

    await prisma.$transaction(async (tx) => {
      await tx.tourPoi.deleteMany({ where: { tourId: id } });
      await tx.tourPoi.createMany({ data: buildTourPoiRows(id, pois) });
    });

    return this.getById(id);
  },

  async remove(id: string) {
    const tour = await prisma.tour.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!tour) throw AppError.notFound('Tour not found');

    await prisma.tour.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: TOUR_STATUS.archived,
      },
    });
  },
};
