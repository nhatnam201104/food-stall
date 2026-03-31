import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Get the backend server URL for API requests
 * This handles the different network configurations for mobile devices
 */
const getBackendUrl = (): string => {
  // Priority 1: EXPO_PUBLIC_API_URL from environment
  const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envBase) {
    // Extract base URL without /api/v1 path
    const match = envBase.match(/^(https?:\/\/[^\/]+)/);
    if (match) return match[1];
    return envBase;
  }

  // Priority 2: Get from Expo/React Native runtime
  // For Expo Go and development builds
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (scriptURL) {
    try {
      const parsed = new URL(scriptURL);
      const host = parsed.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3000`;
      }
    } catch {
      // ignore
    }
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const [host] = hostUri.split(':');
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  // Priority 3: Platform-specific defaults
  if (Platform.OS === 'android') {
    // Android emulator: 10.0.2.2 maps to host machine's localhost
    return 'http://10.0.2.2:3000';
  }

  // Fallback for iOS simulator or web
  return 'http://localhost:3000';
};

/**
 * Check if a URL is a valid absolute URL
 */
const isAbsoluteUrl = (url: string): boolean => {
  return /^https?:\/\//i.test(url);
};

/**
 * Transform an image URL to use the correct backend host.
 * This is necessary because backend returns URLs with 'localhost' which
 * don't work on mobile devices - we need to replace them with the
 * actual backend server address.
 *
 * @param url - The image URL (can be absolute or relative)
 * @returns The transformed URL with correct backend host
 */
export const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Already a valid external URL (not localhost) - return as is
  if (isAbsoluteUrl(url) && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }

  // Handle relative URLs like /uploads/filename
  if (!isAbsoluteUrl(url)) {
    const baseUrl = getBackendUrl();
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Handle localhost URLs - replace with correct backend host
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const baseUrl = getBackendUrl();
    // Extract the path from the localhost URL
    const urlObj = new URL(url);
    return `${baseUrl}${urlObj.pathname}`;
  }

  return url;
};

export default getFullImageUrl;
