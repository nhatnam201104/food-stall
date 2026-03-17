import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';
import type {
  AuthSessionUser,
  LoginPayload,
  MerchantRegisterPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

export interface LoginResponse {
  token: string;
  user: AuthSessionUser;
}

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', payload),

  register: (payload: MerchantRegisterPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/register', payload),

  logout: () =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    axiosInstance.get<ApiResponse<AuthSessionUser>>('/auth/me'),

  updateProfile: (payload: UpdateProfilePayload) =>
    axiosInstance.put<ApiResponse<AuthSessionUser>>('/auth/profile', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    axiosInstance.put<ApiResponse<null>>('/auth/change-password', payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', payload),
};
