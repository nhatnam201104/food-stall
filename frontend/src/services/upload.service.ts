import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.types';

export const uploadService = {
  /**
   * Tải ảnh lên server và trả về đối tượng có đường link URL của ảnh.
   */
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post<ApiResponse<{ url: string; filename: string; size: number }>>(
      '/upload/image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  uploadPublicImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post<ApiResponse<{ url: string; filename: string; size: number }>>(
      '/upload/public-image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};
