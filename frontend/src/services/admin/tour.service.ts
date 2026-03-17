import axiosInstance from '../../configs/axios.config';
import type { ApiResponse, PaginationParams } from '../../types/api.types';
import type { Tour } from '../../types/domain.types';

export interface TourPoiInput {
  poiId: string;
  isMandatory?: boolean;
}

export interface AdminTourPayload {
  name: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'active' | 'draft' | 'archived';
  estimatedDurationMinutes?: number;
  pois: TourPoiInput[];
}

export interface AdminTourListParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'draft' | 'archived';
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface RoutePreviewWaypoint {
  latitude: number;
  longitude: number;
}

export interface RoutePreviewPayload {
  mode: 'walking' | 'driving';
  waypoints: RoutePreviewWaypoint[];
}

export interface RoutePreviewResult {
  mode: 'walking' | 'driving';
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  routePath: Array<[number, number]>;
}

export const adminTourService = {
  list: (params: AdminTourListParams) =>
    axiosInstance.get<ApiResponse<Tour[]>>('/admin/tours', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Tour>>(`/admin/tours/${id}`),

  create: (payload: AdminTourPayload) =>
    axiosInstance.post<ApiResponse<Tour>>('/admin/tours', payload),

  update: (id: string, payload: Partial<AdminTourPayload>) =>
    axiosInstance.put<ApiResponse<Tour>>(`/admin/tours/${id}`, payload),

  routePreview: (payload: RoutePreviewPayload) =>
    axiosInstance.post<ApiResponse<RoutePreviewResult>>('/admin/tours/route-preview', payload),

  replacePois: (id: string, pois: TourPoiInput[]) =>
    axiosInstance.put<ApiResponse<Tour>>(`/admin/tours/${id}/pois`, { pois }),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/tours/${id}`),
};
