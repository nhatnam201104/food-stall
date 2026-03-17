import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/hash.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { AppError } from '../../errors/app-error';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

/** Shared user select for consistent responses */
const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
} as const;

export const merchantService = {
  async list(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const { search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as {
      search?: string;
      isActive?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const whereClause: Prisma.MerchantWhereInput = {
      // Exclude soft-deleted merchants
      user: { isDeleted: false },
    };

    // Filter by account status (isActive on the linked user)
    if (isActive !== undefined) {
      whereClause.user = {
        ...whereClause.user as object,
        isActive: isActive === 'true',
      };
    }

    if (search) {
      whereClause.OR = [
        { shopName: { contains: search } },
        { contactEmail: { contains: search } },
        { user: { fullName: { contains: search }, isDeleted: false } },
      ];
    }

    const orderBy: Prisma.MerchantOrderByWithRelationInput =
      sortBy === 'shopName'
        ? { shopName: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder }
        : { createdAt: (sortOrder === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder };

    const [total, merchants] = await Promise.all([
      prisma.merchant.count({ where: whereClause }),
      prisma.merchant.findMany({
        where: whereClause,
        include: {
          user: { select: USER_SELECT },
          _count: { select: { pointsOfInterest: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return { merchants, pagination: buildPaginationMeta(total, page, limit) };
  },

  async getById(id: string) {
    const merchant = await prisma.merchant.findFirst({
      where: { id, user: { isDeleted: false } },
      include: {
        user: { select: USER_SELECT },
        _count: { select: { pointsOfInterest: true } },
      },
    });
    if (!merchant) throw AppError.notFound('Merchant not found');
    return merchant;
  },

  async create(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string | null;
    shopName: string;
    address?: string;
    contactEmail?: string;
  }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw AppError.conflict('Email already in use', 'EMAIL_EXISTS');

    const merchantRole = await prisma.role.findUnique({ where: { name: 'merchant' } });
    if (!merchantRole) throw new AppError('Role configuration error', 500, 'CONFIG_ERROR');

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        roleId: merchantRole.id,
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        phone: data.phone,
        avatarUrl: data.avatarUrl || null,
        merchant: {
          create: {
            shopName: data.shopName,
            address: data.address,
            contactEmail: data.contactEmail || data.email,
          },
        },
      },
      include: {
        role: true,
        merchant: true,
      },
    });

    return user;
  },

  async update(id: string, data: {
    shopName?: string;
    address?: string;
    contactEmail?: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    fullName?: string;
    phone?: string;
    avatarUrl?: string | null;
    isActive?: boolean;
  }) {
    const merchant = await prisma.merchant.findFirst({ where: { id, user: { isDeleted: false } } });
    if (!merchant) throw AppError.notFound('Merchant not found');

    const { fullName, phone, avatarUrl, isActive, ...merchantData } = data;

    await prisma.$transaction([
      prisma.merchant.update({ where: { id }, data: merchantData }),
      ...(fullName !== undefined || phone !== undefined || avatarUrl !== undefined || isActive !== undefined
        ? [prisma.user.update({
            where: { id: merchant.userId },
            data: {
              ...(fullName !== undefined && { fullName }),
              ...(phone !== undefined && { phone }),
              ...(avatarUrl !== undefined && { avatarUrl }),
              ...(isActive !== undefined && { isActive }),
            },
          })]
        : []),
    ]);

    return merchantService.getById(id);
  },

  /** Soft delete: sets isDeleted=true, deletedAt=now, isActive=false for the user account */
  async remove(id: string) {
    const merchant = await prisma.merchant.findFirst({
      where: { id, user: { isDeleted: false } },
    });
    if (!merchant) throw AppError.notFound('Merchant not found');

    await prisma.user.update({
      where: { id: merchant.userId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });
  },

  /** Update account status (activate / deactivate) */
  async updateStatus(id: string, isActive: boolean) {
    const merchant = await prisma.merchant.findFirst({
      where: { id, user: { isDeleted: false } },
    });
    if (!merchant) throw AppError.notFound('Merchant not found');

    return prisma.user.update({
      where: { id: merchant.userId },
      data: { isActive },
    });
  },

  async updateLogo(id: string, logoUrl: string) {
    const merchant = await prisma.merchant.findFirst({ where: { id, user: { isDeleted: false } } });
    if (!merchant) throw AppError.notFound('Merchant not found');
    return prisma.merchant.update({ where: { id }, data: { logoUrl } });
  },
};
