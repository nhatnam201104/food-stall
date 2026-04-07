export const POI_APPROVAL_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type PoiApprovalStatus =
  (typeof POI_APPROVAL_STATUS)[keyof typeof POI_APPROVAL_STATUS];

export const POI_AUDIO_MODE = {
  tts: "tts",
  file: "file",
} as const;

export const POI_LANGUAGE_CODES = {
  vi: "vi",
  en: "en",
  zh: "zh",
} as const;

export type PoiLanguageCode =
  (typeof POI_LANGUAGE_CODES)[keyof typeof POI_LANGUAGE_CODES];
