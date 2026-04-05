import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      const pathname = window.location.pathname;
      const isAuthPage = pathname.startsWith('/auth/');
      if (!isAuthPage) {
        const redirectTo = pathname.startsWith('/merchant/')
          ? '/auth/merchant/login'
          : '/auth/admin/login';
        window.location.href = redirectTo;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
