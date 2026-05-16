import { getApiOrigin } from '../configs/api-url.config';

/**
 * Get the backend server URL for API requests
 * This handles the different network configurations for mobile devices
 */
const getBackendUrl = (): string => getApiOrigin();

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
