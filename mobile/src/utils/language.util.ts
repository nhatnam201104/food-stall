import { getLocales } from "expo-localization";

// ─── Supported languages (ISO 639-1 base codes) ──────────────────────────────
export type SupportedLanguage =
  | "vi"
  | "en"
  | "zh"
  | "fr"
  | "ja"
  | "ko"
  | "de"
  | "es"
  | "pt"
  | "ru"
  | "th"
  | "id";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "vi",
  "en",
  "zh",
  "fr",
  "ja",
  "ko",
  "de",
  "es",
  "pt",
  "ru",
  "th",
  "id",
];

/**
 * Normalize a BCP-47 language tag (e.g. 'ja-JP', 'fr-FR', 'zh-Hans-CN')
 * to a supported ISO 639-1 base code (e.g. 'ja', 'fr', 'zh').
 * Falls back to 'vi' if no match found.
 */
export function normalizeToBaseLang(raw: string): SupportedLanguage {
  if (!raw || typeof raw !== "string") return "vi";

  const lower = raw.trim().toLowerCase();

  // Direct match (e.g. 'vi', 'en', 'ja')
  if (SUPPORTED_LANGUAGES.includes(lower as SupportedLanguage)) {
    return lower as SupportedLanguage;
  }

  // Extract base code from BCP-47 (e.g. 'ja-JP' → 'ja', 'zh-Hans' → 'zh')
  const base = lower.split("-")[0];
  if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
    return base as SupportedLanguage;
  }

  // Special mappings for common variants
  const specialMappings: Record<string, SupportedLanguage> = {
    "zh-hans": "zh",
    "zh-hant": "zh",
    "zh-cn": "zh",
    "zh-tw": "zh",
    "pt-br": "pt",
    "en-us": "en",
    "en-gb": "en",
  };
  const mapped = specialMappings[lower];
  if (mapped) return mapped;

  return "vi"; // Default fallback
}

/**
 * Detect device language and map to supported language code.
 * Priority: device locales → system default → fallback 'vi'.
 */
export function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();

    for (const locale of locales) {
      const lang = (locale.languageCode ?? "").toLowerCase();

      // Exact match
      if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
        return lang as SupportedLanguage;
      }

      // Handle regional variants: zh-Hans, zh-Hant, en-US, en-GB
      const base = lang.split("-")[0];
      if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
        return base as SupportedLanguage;
      }
    }
  } catch {
    // Platform not supported → default
  }

  return "vi";
}

/**
 * Language display labels for UI.
 */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  ru: "Русский",
  th: "ไทย",
  id: "Bahasa Indonesia",
};

/**
 * Convert language code to TTS-friendly language code.
 * Google TTS uses 'zh-CN' instead of just 'zh'.
 */
export function toTtsLanguage(lang: SupportedLanguage): string {
  const ttsMap: Record<SupportedLanguage, string> = {
    vi: "vi",
    en: "en",
    zh: "zh-CN",
    fr: "fr",
    ja: "ja",
    ko: "ko",
    de: "de",
    es: "es",
    pt: "pt",
    ru: "ru",
    th: "th",
    id: "id",
  };
  return ttsMap[lang];
}
