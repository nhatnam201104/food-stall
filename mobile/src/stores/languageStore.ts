import { create } from "zustand";
import {
  detectDeviceLanguage,
  normalizeToBaseLang,
  type SupportedLanguage,
} from "../utils/language.util";

// ─── Language Store State ─────────────────────────────────────────────────────
interface LanguageState {
  /** Current app language (ISO 639-1 base code, e.g. 'ja', 'fr') */
  appLanguage: SupportedLanguage;
}

// ─── Language Store Actions ───────────────────────────────────────────────────
interface LanguageActions {
  /** Set app language (accepts BCP-47 or ISO 639-1, auto-normalizes) */
  setAppLanguage: (lang: string) => void;
  /** Re-detect language from device locale */
  syncWithDevice: () => void;
}

export type LanguageStore = LanguageState & LanguageActions;

/**
 * Language Store — Single source of truth for app language.
 *
 * Used by:
 * - poiService.detail() → sends ?lang=ja to backend
 * - AudioManager → ensures TTS voice matches content language
 * - TTSService → generates audio in correct language
 */
export const useLanguageStore = create<LanguageStore>((set) => ({
  // Initialize from device locale
  appLanguage: (() => {
    const detected = detectDeviceLanguage();
    // languageStore initialized
    return detected;
  })(),

  setAppLanguage: (lang: string) => {
    const normalized = normalizeToBaseLang(lang);
    set({ appLanguage: normalized });
  },

  syncWithDevice: () => {
    const detected = detectDeviceLanguage();
    set({ appLanguage: detected });
  },
}));
