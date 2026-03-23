import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { TOUR_STATUS } from '../../constants/tour.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';

export const touristTourService = {
  async list(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const { search } = req.query as { search?: string };

    const where: Prisma.TourWhereInput = {
      isDeleted: false,
      status: TOUR_STATUS.active,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, tours] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          coverImageUrl: true,
          estimatedDurationMinutes: true,
          createdAt: true,
          _count: {
            select: { tourPois: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { tours, pagination: buildPaginationMeta(total, page, limit) };
  },

  async getById(id: string) {
    const tour = await prisma.tour.findFirst({
      where: {
        id,
        isDeleted: false,
        status: TOUR_STATUS.active,
      },
      include: {
        tourPois: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            poi: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                latitude: true,
                longitude: true,
                radiusMeters: true,
                priority: true,
                isActive: true,
                approvalStatus: true,
              },
            },
          },
        },
      },
    });

    if (!tour) throw AppError.notFound('Tour not found');

    const filteredTourPois = tour.tourPois.filter(
      (item) => item.poi.isActive && item.poi.approvalStatus === POI_APPROVAL_STATUS.approved,
    );

    return {
      ...tour,
      tourPois: filteredTourPois,
    };
  },
};
