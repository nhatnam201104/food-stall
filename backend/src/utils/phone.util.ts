/**
 * Normalize Vietnam phone number to E.164 format (+84xxxxxxxxx)
 *
 * Accepted user inputs:
 * - 0912345678
 * - 912345678
 * - +84912345678
 * - 84912345678
 */
export const normalizeVietnamPhone = (input: unknown): string | null => {
  if (typeof input !== 'string') return null;

  const raw = input.trim();
  if (!raw) return null;

  // Keep leading + (if any) and digits only
  const compact = raw
    .replace(/[\s().-]/g, '')
    .replace(/(?!^)\+/g, '');

  if (!/^\+?\d+$/.test(compact)) return null;

  let digits = compact.startsWith('+') ? compact.slice(1) : compact;

  if (digits.startsWith('84')) {
    digits = digits.slice(2);
  }

  // Remove one or many leading 0 from local format, e.g. 0912..., 00123...
  digits = digits.replace(/^0+/, '');

  // VN national number commonly has 9-10 digits after country code conversion
  if (!/^\d{9,10}$/.test(digits)) return null;

  return `+84${digits}`;
};

export const isNormalizedVietnamPhone = (value: unknown): boolean =>
  typeof value === 'string' && /^\+84\d{9,10}$/.test(value);
