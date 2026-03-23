import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';
import type { TourDetail, TourListItem } from '../types/tourist.types';

interface TourListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const tourService = {
  list: (query: TourListQuery) =>
    axiosInstance.get<ApiResponse<TourListItem[]>>('/tourist/tours', { params: query }),

  detail: (id: string) =>
    axiosInstance.get<ApiResponse<TourDetail>>(`/tourist/tours/${id}`),
};
