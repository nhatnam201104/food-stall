import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { signToken } from '../utils/jwt.util';
import { sendPasswordResetEmail } from '../utils/mail.util';
import { AppError } from '../errors/app-error';
import { randomUUID } from 'crypto';
import { normalizeVietnamPhone } from '../utils/phone.util';

const normalizeOptionalVietnamPhone = (phone?: string): string | undefined => {
  if (phone === undefined || phone === null || phone === '') return undefined;
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized) {
    throw AppError.badRequest('Phone number must be a valid Vietnam number (auto format +84)');
  }
  return normalized;
};

export const authService = {
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
    shopName: string;
    address?: string;
  }) {
    const normalizedPhone = normalizeOptionalVietnamPhone(data.phone);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw AppError.conflict('Email already in use', 'EMAIL_EXISTS');
    }

    const merchantRole = await prisma.role.findUnique({ where: { name: 'merchant' } });
    if (!merchantRole) throw new AppError('Role configuration error', 500, 'CONFIG_ERROR');

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        roleId: merchantRole.id,
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        phone: normalizedPhone,
        avatarUrl: data.avatarUrl || null,
        merchant: {
          create: {
            shopName: data.shopName,
            address: data.address,
            contactEmail: data.email,
          },
        },
      },
      include: { role: true, merchant: true },
    });

    return { user, message: 'Merchant registered successfully. Please login.' };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, merchant: true },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated. Please contact support.', 'ACCOUNT_INACTIVE');
    }

    const token = signToken({ userId: user.id, roleId: user.roleId, roleName: user.role.name });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        isActive: user.isActive,
        merchant: user.merchant
          ? {
              id: user.merchant.id,
              shopName: user.merchant.shopName,
              address: user.merchant.address,
              contactEmail: user.merchant.contactEmail,
            }
          : null,
      },
    };
  },

  async registerTourist(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
  }) {
    const normalizedPhone = normalizeOptionalVietnamPhone(data.phone);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw AppError.conflict('Email already in use', 'EMAIL_EXISTS');
    }

    const touristRole = await prisma.role.findUnique({ where: { name: 'tourist' } });
    if (!touristRole) throw new AppError('Role configuration error', 500, 'CONFIG_ERROR');

    const passwordHash = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        roleId: touristRole.id,
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        phone: normalizedPhone,
        avatarUrl: data.avatarUrl || null,
      },
    });

    return { message: 'Tourist account registered successfully. Please login.' };
  },

  async loginTourist(email: string, password: string) {
    const result = await this.login(email, password);

    if (result.user.role !== 'tourist') {
      throw AppError.forbidden('This login is only available for tourist accounts', 'ROLE_NOT_ALLOWED');
    }

    return result;
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, merchant: true },
    });
    if (!user) throw AppError.notFound('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      merchant: user.merchant
        ? {
            id: user.merchant.id,
            shopName: user.merchant.shopName,
            address: user.merchant.address,
            contactEmail: user.merchant.contactEmail,
            logoUrl: user.merchant.logoUrl,
            coverImageUrl: user.merchant.coverImageUrl,
            createdAt: user.merchant.createdAt,
          }
        : null,
    };
  },

  async updateProfile(userId: string, data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string | null;
    shopName?: string;
    address?: string;
    contactEmail?: string;
  }) {
    const normalizedPhone = normalizeOptionalVietnamPhone(data.phone);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, merchant: true },
    });

    if (!existingUser) throw AppError.notFound('User not found');

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.phone !== undefined && { phone: normalizedPhone }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
      });

      if (existingUser.merchant && (data.shopName !== undefined || data.address !== undefined || data.contactEmail !== undefined)) {
        await tx.merchant.update({
          where: { userId },
          data: {
            ...(data.shopName !== undefined && { shopName: data.shopName }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
          },
        });
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, merchant: true },
    });

    if (!user) throw AppError.notFound('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      isActive: user.isActive,
      merchant: user.merchant
        ? {
            id: user.merchant.id,
            shopName: user.merchant.shopName,
            address: user.merchant.address,
            contactEmail: user.merchant.contactEmail,
          }
        : null,
    };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) throw AppError.badRequest('Current password is incorrect', 'WRONG_PASSWORD');

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  },

  async forgotPassword(_email: string) {
    // Token-based reset removed — use OTP flow (/auth/otp/send)
    throw AppError.badRequest('Please use the OTP-based password reset flow', 'USE_OTP_FLOW');
  },

  async resetPassword(_token: string, _newPassword: string) {
    // Token-based reset removed — use OTP flow (/auth/otp/reset)
    throw AppError.badRequest('Please use the OTP-based password reset flow', 'USE_OTP_FLOW');
  },
};
