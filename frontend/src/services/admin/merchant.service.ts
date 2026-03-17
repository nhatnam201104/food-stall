import axiosInstance from '../../configs/axios.config';
import type { ApiResponse, PaginationParams } from '../../types/api.types';
import type { Merchant } from '../../types/domain.types';

export interface MerchantListParams extends PaginationParams {
  search?: string;
  isActive?: 'true' | 'false';
  sortBy?: 'createdAt' | 'shopName';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMerchantPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string | null;
  shopName: string;
  address?: string;
  contactEmail?: string;
}

export interface UpdateMerchantPayload {
  shopName?: string;
  address?: string;
  contactEmail?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export const merchantService = {
  list: (params?: MerchantListParams) =>
    axiosInstance.get<ApiResponse<Merchant[]>>('/admin/merchants', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Merchant>>(`/admin/merchants/${id}`),

  create: (payload: CreateMerchantPayload) =>
    axiosInstance.post<ApiResponse<Merchant>>('/admin/merchants', payload),

  update: (id: string, payload: UpdateMerchantPayload) =>
    axiosInstance.put<ApiResponse<Merchant>>(`/admin/merchants/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/merchants/${id}`),

  updateStatus: (id: string, isActive: boolean) =>
    axiosInstance.patch<ApiResponse<null>>(`/admin/merchants/${id}/status`, { isActive }),

  uploadLogo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axiosInstance.post<ApiResponse<{ logoUrl: string }>>(`/admin/merchants/${id}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
