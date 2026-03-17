const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getApiOrigin = (): string => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:3000';
  }
};

/**
 * Resolve media URL to a browser-loadable absolute URL.
 * Supports:
 * - Absolute URL: http(s)://...
 * - Relative URL from backend: /uploads/xxx.jpg
 * - Relative path without leading slash: uploads/xxx.jpg
 */
export const resolveMediaUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) return raw;

  const origin = getApiOrigin();
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return `${origin}/${raw}`;
};
