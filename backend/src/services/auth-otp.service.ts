import { prisma } from '../config/database';
import { hashPassword } from '../utils/hash.util';
import { sendOtpEmail } from '../utils/mail.util';
import { AppError } from '../errors/app-error';

// Generate 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const authOtpService = {
  async sendOtp(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Check if email exists in database
    if (!user) {
      throw AppError.badRequest('Email không tồn tại trong hệ thống', 'EMAIL_NOT_FOUND');
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.badRequest('Tài khoản đã bị khóa', 'ACCOUNT_INACTIVE');
    }

    // Invalidate any existing unused OTPs for this user
    await prisma.passwordResetOtp.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpCode,
        expiresAt,
        isUsed: false,
      },
    });

    // Send OTP via email with error handling
    try {
      await sendOtpEmail(user.email, user.fullName, otpCode);
      console.log(`✅ OTP sent successfully to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${email}:`, error);
      throw new AppError('Không thể gửi email. Vui lòng thử lại sau.', 500, 'EMAIL_SEND_FAILED');
    }

    return { success: true, expiresIn: 60 };
  },

  async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw AppError.badRequest('Invalid email or OTP', 'INVALID_OTP');
    }

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw AppError.badRequest('Invalid or expired OTP', 'INVALID_OTP');
    }

    return { success: true, userId: user.id };
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw AppError.badRequest('Invalid email or OTP', 'INVALID_OTP');
    }

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw AppError.badRequest('Invalid or expired OTP', 'INVALID_OTP');
    }

    // Mark OTP as used
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  },
};