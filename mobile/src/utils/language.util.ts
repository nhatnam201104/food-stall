import { getLocales } from 'expo-localization';

// Supported languages in the app
export type SupportedLanguage = 'vi' | 'en' | 'zh';

const SUPPORTED: SupportedLanguage[] = ['vi', 'en', 'zh'];

/**
 * Detect device language and map to supported language code.
 * Priority: device locales → system default → fallback 'vi'.
 */
export function detectDeviceLanguage(): SupportedLanguage {
  try {
    // Get all locales ordered by preference
    const locales = getLocales();

    for (const locale of locales) {
      const lang = (locale.languageCode ?? '').toLowerCase();

      // Exact match
      if (SUPPORTED.includes(lang as SupportedLanguage)) {
        return lang as SupportedLanguage;
      }

      // Handle regional variants: zh-Hans, zh-Hant, en-US, en-GB
      const base = lang.split('-')[0];
      if (SUPPORTED.includes(base as SupportedLanguage)) {
        return base as SupportedLanguage;
      }
    }
  } catch {
    // Platform not supported → default
  }

  return 'vi';
}

/**
 * Language display labels for UI.
 */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
};

/**
 * Convert language code to TTS-friendly language code.
 * Google TTS uses 'zh-CN' instead of just 'zh'.
 */
export function toTtsLanguage(lang: SupportedLanguage): string {
  switch (lang) {
    case 'zh':
      return 'zh-CN';
    default:
      return lang;
  }
}
