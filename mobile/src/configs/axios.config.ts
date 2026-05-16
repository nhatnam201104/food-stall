import axios from 'axios';
import { getApiBaseUrl, getCandidateApiBaseUrls } from './api-url.config';

type RetryableConfig = {
  _apiBaseRetryIndex?: number;
  baseURL?: string;
};

const CANDIDATE_BASE_URLS = getCandidateApiBaseUrls();
const BASE_URL = getApiBaseUrl();
let isMobileApiAccessEnabled = false;

const canRequestBeforeAccess = (url?: string): boolean => {
  if (!url) return false;

  return url.includes("/tourist/sessions/start")
    || /\/tourist\/sessions\/[^/]+\/end/.test(url);
};

export const setMobileApiAccessEnabled = (enabled: boolean): void => {
  isMobileApiAccessEnabled = enabled;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

axiosInstance.interceptors.request.use((config) => {
  if (!isMobileApiAccessEnabled && !canRequestBeforeAccess(config.url)) {
    return Promise.reject(new Error("Waiting for an available access slot."));
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = (error?.config || {}) as RetryableConfig;
    const isNetworkOrTimeout =
      error?.code === 'ECONNABORTED'
      || /timeout/i.test(String(error?.message || ''))
      || /network error/i.test(String(error?.message || ''));

    if (isNetworkOrTimeout && CANDIDATE_BASE_URLS.length > 1) {
      const currentBase = config.baseURL || axiosInstance.defaults.baseURL || BASE_URL;
      const currentIndex = config._apiBaseRetryIndex ?? Math.max(0, CANDIDATE_BASE_URLS.indexOf(currentBase));
      const nextIndex = currentIndex + 1;

      if (nextIndex < CANDIDATE_BASE_URLS.length) {
        const nextBase = CANDIDATE_BASE_URLS[nextIndex];
        config._apiBaseRetryIndex = nextIndex;
        config.baseURL = nextBase;
        axiosInstance.defaults.baseURL = nextBase;
        return axiosInstance.request(config);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
