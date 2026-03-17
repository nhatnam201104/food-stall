/**
 * Keep only local digits part for VN phone input UI (without +84).
 * - strips spaces/symbols
 * - strips leading 84 or 0 prefix
 */
export const normalizeVietnamPhoneInput = (value: unknown): string => {
  if (typeof value !== 'string') return '';

  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('84')) {
    digits = digits.slice(2);
  }

  // Auto remove leading 0 when user types local number
  digits = digits.replace(/^0+/, '');

  return digits;
};

/**
 * Convert local VN phone input to normalized E.164 +84 format.
 */
export const toVietnamPhoneE164 = (value: unknown): string | undefined => {
  const digits = normalizeVietnamPhoneInput(value);
  if (!digits) return undefined;
  if (!/^\d{9,10}$/.test(digits)) return undefined;
  return `+84${digits}`;
};

/**
 * Convert stored phone (+84...) to local input value (without +84).
 */
export const toVietnamPhoneInputValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return normalizeVietnamPhoneInput(value);
};
