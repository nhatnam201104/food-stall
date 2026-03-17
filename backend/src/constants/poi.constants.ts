export const POI_APPROVAL_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export type PoiApprovalStatus = typeof POI_APPROVAL_STATUS[keyof typeof POI_APPROVAL_STATUS];

export const POI_AUDIO_MODE = {
  tts: 'tts',
  file: 'file',
} as const;

export const POI_LANGUAGE_CODES = {
  vi: 'vi',
  en: 'en',
  zh: 'zh',
} as const;

export type PoiLanguageCode = typeof POI_LANGUAGE_CODES[keyof typeof POI_LANGUAGE_CODES];

export const VINH_KHANH_BOUNDS = {
  minLat: 10.752,
  maxLat: 10.765,
  minLng: 106.698,
  maxLng: 106.7085,
  centerLat: 10.759,
  centerLng: 106.7032,
} as const;
