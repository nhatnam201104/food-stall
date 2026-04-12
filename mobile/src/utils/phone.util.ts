import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone input to E.164 format.
 * Returns null if the input is invalid or empty.
 * @param input - raw phone string (e.g. "0912345678", "+84912345678", "+15551234567")
 * @param defaultCountry - ISO 3166-1 alpha-2 country code used when no country prefix is present
 */
export const normalizePhone = (input: string | null | undefined, defaultCountry: CountryCode = 'VN'): string | null => {
  if (!input || !input.trim()) return null;
  try {
    const parsed = parsePhoneNumber(input.trim(), defaultCountry);
    if (parsed && parsed.isValid()) return parsed.format('E.164');
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if a phone string is valid for the given default country.
 * Accepts local format (e.g. "0912345678") and international format (e.g. "+84912345678").
 */
export const isValidPhone = (input: string | null | undefined, defaultCountry: CountryCode = 'VN'): boolean => {
  if (!input || !input.trim()) return false;
  try {
    return isValidPhoneNumber(input.trim(), defaultCountry);
  } catch {
    return false;
  }
};

/**
 * Format a stored E.164 phone for display (national format, e.g. "0912 345 678").
 * Falls back to the original input if it cannot be parsed.
 */
export const formatPhoneForDisplay = (input: string | null | undefined, defaultCountry: CountryCode = 'VN'): string => {
  if (!input || !input.trim()) return '';
  try {
    const parsed = parsePhoneNumber(input.trim(), defaultCountry);
    if (parsed && parsed.isValid()) return parsed.formatNational();
  } catch {
    // fall through
  }
  return input;
};
