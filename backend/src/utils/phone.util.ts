import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format using libphonenumber-js.
 * Supports international numbers (e.g. +1..., +44...) and local VN numbers (0912...).
 *
 * @param input - Raw phone string from user input
 * @param defaultCountry - ISO 3166-1 alpha-2 country code used when input has no country prefix (default: 'VN')
 * @returns E.164 string (e.g. "+84912345678") or null if invalid
 */
export const normalizePhone = (input: unknown, defaultCountry: CountryCode = 'VN'): string | null => {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;
  try {
    const parsed = parsePhoneNumber(raw, defaultCountry);
    if (parsed && parsed.isValid()) return parsed.format('E.164');
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if a value is a valid E.164 phone number (any country).
 */
export const isNormalizedPhone = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  if (!/^\+[1-9]\d{1,14}$/.test(value)) return false;
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Legacy aliases – kept for any direct call sites not yet migrated
// ---------------------------------------------------------------------------
/** @deprecated Use normalizePhone() instead */
export const normalizeVietnamPhone = (input: unknown): string | null => normalizePhone(input, 'VN');

/** @deprecated Use isNormalizedPhone() instead */
export const isNormalizedVietnamPhone = (value: unknown): boolean => isNormalizedPhone(value);
