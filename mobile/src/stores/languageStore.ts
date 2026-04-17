import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  detectDeviceLanguage,
  normalizeToBaseLang,
  type SupportedLanguage,
} from "../utils/language.util";
import { STORAGE_KEYS } from "../constants/storage.constants";

// ─── Language Store State ─────────────────────────────────────────────────────
interface LanguageState {
  /** Current app language (ISO 639-1 base code, e.g. 'ja', 'fr') */
  appLanguage: SupportedLanguage;
  /** Whether the language has been hydrated from storage */
  hydrated: boolean;
}

// ─── Language Store Actions ───────────────────────────────────────────────────
interface LanguageActions {
  /** Set app language (accepts BCP-47 or ISO 639-1, auto-normalizes) and persists */
  setAppLanguage: (lang: string) => void;
  /** Re-detect language from device locale and persist */
  syncWithDevice: () => void;
  /** Check if current appLanguage matches device language */
  isDeviceLanguage: () => boolean;
  /** Hydrate language from AsyncStorage (call on app start) */
  hydrate: () => Promise<void>;
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
export const useLanguageStore = create<LanguageStore>((set, get) => ({
  // Initialize from device locale (will be overridden by hydrate())
  appLanguage: detectDeviceLanguage(),
  hydrated: false,

  setAppLanguage: (lang: string) => {
    const normalized = normalizeToBaseLang(lang);
    set({ appLanguage: normalized });
    // Persist to storage
    AsyncStorage.setItem(STORAGE_KEYS.poiLanguage, normalized).catch(() => {});
  },

  syncWithDevice: () => {
    const detected = detectDeviceLanguage();
    set({ appLanguage: detected });
    // Remove persisted preference (back to device default)
    AsyncStorage.removeItem(STORAGE_KEYS.poiLanguage).catch(() => {});
  },

  isDeviceLanguage: () => {
    const current = get().appLanguage;
    const device = detectDeviceLanguage();
    return current === device;
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.poiLanguage);
      if (saved) {
        const normalized = normalizeToBaseLang(saved);
        set({ appLanguage: normalized, hydrated: true });
        return;
      }
    } catch {
      // Storage read failed → keep device default
    }
    // No saved preference → use device language
    const detected = detectDeviceLanguage();
    set({ appLanguage: detected, hydrated: true });
  },
}));
