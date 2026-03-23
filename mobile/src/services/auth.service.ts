import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  TouristRegisterPayload,
  TouristSessionUser,
} from '../types/auth.types';

export const authService = {
  loginTourist: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/tourist/login', payload),

  registerTourist: (payload: TouristRegisterPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/tourist/register', payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', payload),

  logout: () =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    axiosInstance.get<ApiResponse<TouristSessionUser>>('/auth/me'),
};
