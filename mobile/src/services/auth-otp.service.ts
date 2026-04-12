import api from '../configs/axios.config';
import { ApiResponse } from '../types/api.types';

export const authOtpService = {
  async sendOtp(email: string): Promise<{ success: boolean; expiresIn?: number; message?: string }> {
    try {
      const response = await api.post('/auth/otp/send-otp', { email });
      return response.data;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    }
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; userId?: string; message?: string }> {
    try {
      const response = await api.post('/auth/otp/verify-otp', { email, otp });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP';
      throw new Error(errorMessage);
    }
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/auth/otp/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      throw new Error(errorMessage);
    }
  },
};
