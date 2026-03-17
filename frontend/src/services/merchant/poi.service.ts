import axiosInstance from '../../configs/axios.config';
import type { ApiResponse, PaginationParams } from '../../types/api.types';
import type { PointOfInterest } from '../../types/domain.types';

export interface MerchantPoiListParams extends PaginationParams {
  search?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive?: 'true' | 'false';
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface MerchantPoiPayload {
  name: string;
  description?: string;
  address: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  priority?: number;
  isActive?: boolean;
  audioMode: 'tts' | 'file';
  ttsContent?: string;
  audioUrl?: string;
  cooldownSeconds?: number;
}

export const merchantPoiService = {
  list: (params: MerchantPoiListParams) =>
    axiosInstance.get<ApiResponse<PointOfInterest[]>>('/merchant/pois', { params }),

  map: (params?: Omit<MerchantPoiListParams, 'page' | 'limit' | 'search' | 'sortBy' | 'sortOrder'>) =>
    axiosInstance.get<ApiResponse<PointOfInterest[]>>('/merchant/pois/map', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<PointOfInterest>>(`/merchant/pois/${id}`),

  create: (payload: MerchantPoiPayload) =>
    axiosInstance.post<ApiResponse<PointOfInterest>>('/merchant/pois', payload),

  update: (id: string, payload: Partial<MerchantPoiPayload>) =>
    axiosInstance.put<ApiResponse<PointOfInterest>>(`/merchant/pois/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/merchant/pois/${id}`),
};
