import { Request, Response, NextFunction } from 'express';
import { authOtpService } from '../services/auth-otp.service';
import { sendSuccess } from '../utils/response.util';

export const authOtpController = {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authOtpService.sendOtp(email);
      sendSuccess(res, result, 'OTP has been sent to your email.');
    } catch (err) { next(err); }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await authOtpService.verifyOtp(email, otp);
      sendSuccess(res, result, 'OTP verified successfully.');
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authOtpService.resetPassword(email, otp, newPassword);
      sendSuccess(res, result, 'Password has been reset successfully. Please login with your new password.');
    } catch (err) { next(err); }
  },
};