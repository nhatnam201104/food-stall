import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.util';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, password, phone, shopName, address, avatarUrl } = req.body;
      const result = await authService.register({ fullName, email, password, phone, shopName, address, avatarUrl });
      sendCreated(res, null, result.message);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login successful');
    } catch (err) { next(err); }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getMe(userId);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { fullName, phone, avatarUrl, shopName, address, contactEmail } = req.body;
      const user = await authService.updateProfile(userId, {
        fullName,
        phone,
        avatarUrl,
        shopName,
        address,
        contactEmail,
      });
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (err) { next(err); }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      sendSuccess(res, null, 'If an account with this email exists, a reset link has been sent.');
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      sendSuccess(res, null, 'Password has been reset successfully. Please login with your new password.');
    } catch (err) { next(err); }
  },
};
