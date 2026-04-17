import axios from 'axios';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Flag ngăn chặn vòng lặp redirect khi token expire ────────────────────────
let _isRedirecting = false;

// ─── Request interceptor: inject Bearer token ────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: unwrap data / handle global errors ────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !_isRedirecting) {
      // Đánh dấu đang redirect để tránh gọi nhiều lần
      _isRedirecting = true;

      // Xóa session cũ
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('audio-tour:auth-session');

      const pathname = window.location.pathname;
      const isAuthPage = pathname.startsWith('/auth/');

      if (!isAuthPage) {
        const redirectTo = pathname.startsWith('/merchant/')
          ? '/auth/merchant/login'
          : '/auth/admin/login';

        // Hiển thị thông báo trước khi redirect
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

        // Delay redirect để toast hiển thị
        setTimeout(() => {
          window.location.href = `${redirectTo}?expired=true`;
          // Reset flag sau khi redirect hoàn tất
          _isRedirecting = false;
        }, 500);
      } else {
        // Nếu đã ở trang auth, chỉ reset flag
        _isRedirecting = false;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
