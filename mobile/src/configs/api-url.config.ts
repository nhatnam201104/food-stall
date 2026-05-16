import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

declare const __DEV__: boolean;

const API_PATH = '/api/v1';
const DEFAULT_LOCAL_API_URL = 'http://localhost:3000/api/v1';

const isDevRuntime = (): boolean => {
  return typeof __DEV__ === 'boolean' ? __DEV__ : process.env.NODE_ENV !== 'production';
};

export const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_LOCAL_API_URL;

  return trimmed.endsWith(API_PATH) ? trimmed : `${trimmed}${API_PATH}`;
};

export const getApiOrigin = (apiUrl = getApiBaseUrl()): string => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }
};

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

export const getCandidateApiBaseUrls = (): string[] => {
  const urls: string[] = [];
  const envBase =
    process.env.EXPO_PUBLIC_API_URL?.trim()
    || process.env.VITE_API_URL?.trim();

  if (envBase) {
    urls.push(normalizeApiBaseUrl(envBase));
  }

  if (isDevRuntime()) {
    const scriptHost = getHostFromScriptURL();
    if (scriptHost) {
      urls.push(normalizeApiBaseUrl(`http://${scriptHost}:3000`));
    }

    const expoHost = getHostFromExpoConfig();
    if (expoHost) {
      urls.push(normalizeApiBaseUrl(`http://${expoHost}:3000`));
    }

    if (Platform.OS === 'android') {
      urls.push('http://10.0.2.2:3000/api/v1');
    }

    urls.push(DEFAULT_LOCAL_API_URL);
  }

  if (urls.length === 0) {
    urls.push(DEFAULT_LOCAL_API_URL);
  }

  return Array.from(new Set(urls));
};

export const getApiBaseUrl = (): string => {
  return getCandidateApiBaseUrls()[0] || DEFAULT_LOCAL_API_URL;
};
