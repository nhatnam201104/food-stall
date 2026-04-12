import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';

export const uploadService = {
  uploadImage: (formData: FormData) =>
    axiosInstance.post<ApiResponse<{ url: string }>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};