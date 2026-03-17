import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { POI_APPROVAL_STATUS } from '../../constants/poi.constants';
import { AppError } from '../../errors/app-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.util';

const assertValidReviewer = async (reviewerId: string): Promise<void> => {
  const reviewer = await prisma.user.findFirst({
    where: {
      id: reviewerId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!reviewer) {
    throw AppError.unauthorized('Invalid admin session. Please login again.');
  }
};

export const adminPoiService = {
  async list(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const { search, approvalStatus, isActive, merchantId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as {
      search?: string;
      approvalStatus?: string;
      isActive?: string;
      merchantId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const where: Prisma.PointOfInterestWhereInput = {
      isDeleted: false,
      ...(approvalStatus ? { approvalStatus } : {}),
      ...(merchantId ? { merchantId } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { merchant: { shopName: { contains: search } } },
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
        include: {
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
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return { pois, pagination: buildPaginationMeta(total, page, limit) };
  },

  async map(req: Request) {
    const { approvalStatus, isActive } = req.query as {
      approvalStatus?: string;
      isActive?: string;
    };

    return prisma.pointOfInterest.findMany({
      where: {
        isDeleted: false,
        ...(approvalStatus ? { approvalStatus } : {}),
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      },
      select: {
        id: true,
        merchantId: true,
        name: true,
        latitude: true,
        longitude: true,
        approvalStatus: true,
        isActive: true,
        merchant: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getById(id: string) {
    const poi = await prisma.pointOfInterest.findFirst({
      where: { id, isDeleted: false },
      include: {
        merchant: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
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
      },
    });

    if (!poi) throw AppError.notFound('POI not found');
    return poi;
  },

  async approve(id: string, adminUserId: string, reviewNote?: string) {
    const poi = await prisma.pointOfInterest.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!poi) throw AppError.notFound('POI not found');

    await assertValidReviewer(adminUserId);

    return prisma.pointOfInterest.update({
      where: { id },
      data: {
        approvalStatus: POI_APPROVAL_STATUS.approved,
        reviewNote: reviewNote ?? null,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });
  },

  async reject(id: string, adminUserId: string, reviewNote: string) {
    const poi = await prisma.pointOfInterest.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!poi) throw AppError.notFound('POI not found');

    await assertValidReviewer(adminUserId);

    return prisma.pointOfInterest.update({
      where: { id },
      data: {
        approvalStatus: POI_APPROVAL_STATUS.rejected,
        reviewNote,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });
  },

  async updateActive(id: string, isActive: boolean) {
    const poi = await prisma.pointOfInterest.findFirst({ where: { id, isDeleted: false }, select: { id: true } });
    if (!poi) throw AppError.notFound('POI not found');

    return prisma.pointOfInterest.update({
      where: { id },
      data: { isActive },
    });
  },
};
