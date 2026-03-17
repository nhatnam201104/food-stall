import axiosInstance from '../../configs/axios.config';
import type { ApiResponse, PaginationParams } from '../../types/api.types';
import type { PointOfInterest } from '../../types/domain.types';

export interface AdminPoiListParams extends PaginationParams {
  search?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive?: 'true' | 'false';
  merchantId?: string;
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const adminPoiService = {
  list: (params: AdminPoiListParams) =>
    axiosInstance.get<ApiResponse<PointOfInterest[]>>('/admin/pois', { params }),

  map: (params?: Omit<AdminPoiListParams, 'page' | 'limit' | 'search' | 'sortBy' | 'sortOrder' | 'merchantId'>) =>
    axiosInstance.get<ApiResponse<PointOfInterest[]>>('/admin/pois/map', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<PointOfInterest>>(`/admin/pois/${id}`),

  approve: (id: string, reviewNote?: string) =>
    axiosInstance.patch<ApiResponse<PointOfInterest>>(`/admin/pois/${id}/approve`, { reviewNote }),

  reject: (id: string, reviewNote: string) =>
    axiosInstance.patch<ApiResponse<PointOfInterest>>(`/admin/pois/${id}/reject`, { reviewNote }),

  updateActive: (id: string, isActive: boolean) =>
    axiosInstance.patch<ApiResponse<PointOfInterest>>(`/admin/pois/${id}/active`, { isActive }),
};
