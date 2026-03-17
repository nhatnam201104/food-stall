import type { PoiLanguageCode } from '../types';

export const POI_LANGUAGE_OPTIONS: Array<{ value: PoiLanguageCode; label: string }> = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese (中文)' },
];

export const POI_LANGUAGE_TO_SPEECH_LOCALE: Record<PoiLanguageCode, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
};

export const getPoiLanguageLabel = (languageCode?: string): string => {
  const found = POI_LANGUAGE_OPTIONS.find((item) => item.value === languageCode);
  return found?.label || languageCode || 'Unknown';
};
