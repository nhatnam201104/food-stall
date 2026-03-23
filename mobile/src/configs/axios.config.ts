import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { getAccessToken } from '../utils/auth-storage.util';

type RetryableConfig = {
  _apiBaseRetryIndex?: number;
  baseURL?: string;
};

const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1';

const getHostFromScriptURL = (): string | null => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) return null;

  try {
    const parsed = new URL(scriptURL);
    return parsed.hostname || null;
  } catch {
    return null;
  }
};

const getHostFromExpoConfig = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const [host] = hostUri.split(':');
  return host || null;
};

const buildBaseUrls = (): string[] => {
  const urls: string[] = [];
  const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (envBase) {
    urls.push(envBase);
  }

  const scriptHost = getHostFromScriptURL();
  if (scriptHost) {
    urls.push(`http://${scriptHost}:3000/api/v1`);
  }

  const expoHost = getHostFromExpoConfig();
  if (expoHost) {
    urls.push(`http://${expoHost}:3000/api/v1`);
  }

  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:3000/api/v1');
  }

  urls.push(DEFAULT_BASE_URL);

  return Array.from(new Set(urls));
};

const CANDIDATE_BASE_URLS = buildBaseUrls();
const BASE_URL = CANDIDATE_BASE_URLS[0] || DEFAULT_BASE_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
