import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format using libphonenumber-js.
 * Supports international numbers and local VN numbers (0912...).
 *
 * @param value - Raw phone string from user input
 * @param defaultCountry - ISO 3166-1 alpha-2 country code (default: 'VN')
 * @returns E.164 string (e.g. "+84912345678") or undefined if invalid/empty
 */
export const normalizePhone = (value: unknown, defaultCountry: CountryCode = 'VN'): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  try {
    const parsed = parsePhoneNumber(raw, defaultCountry);
    if (parsed && parsed.isValid()) return parsed.format('E.164');
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Check if a value is a valid phone number for the given country.
 *
 * @param value - Raw or E.164 phone string
 * @param defaultCountry - ISO 3166-1 alpha-2 country code (default: 'VN')
 */
export const isValidPhone = (value: unknown, defaultCountry: CountryCode = 'VN'): boolean => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return isValidPhoneNumber(value.trim(), defaultCountry);
  } catch {
    return false;
  }
};

/**
 * Format an E.164 phone number for display (national format for VN, international otherwise).
 * e.g. "+84912345678" → "0912 345 678"
 */
export const formatPhoneForDisplay = (value: unknown, defaultCountry: CountryCode = 'VN'): string => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const parsed = parsePhoneNumber(value.trim(), defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.country === defaultCountry
        ? parsed.formatNational()
        : parsed.formatInternational();
    }
    return value;
  } catch {
    return typeof value === 'string' ? value : '';
  }
};

// ---------------------------------------------------------------------------
// Legacy aliases – kept for backward compat in existing components
// ---------------------------------------------------------------------------
/** @deprecated Use normalizePhone() and handle undefined */
export const normalizeVietnamPhoneInput = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const result = normalizePhone(value, 'VN');
  if (!result) return typeof value === 'string' ? value.replace(/\D/g, '') : '';
  // Strip country code for local display
  return result.replace(/^\+84/, '0');
};

/** @deprecated Use normalizePhone() instead */
export const toVietnamPhoneE164 = (value: unknown): string | undefined =>
  normalizePhone(value, 'VN');

/** @deprecated Use formatPhoneForDisplay() instead */
export const toVietnamPhoneInputValue = (value: unknown): string =>
  formatPhoneForDisplay(value, 'VN');
