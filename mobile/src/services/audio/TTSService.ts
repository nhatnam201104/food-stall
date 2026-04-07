import axiosInstance from "../../configs/axios.config";
import { audioCache } from "./AudioCache";
import { toTtsLanguage } from "../../utils/language.util";
import type { SupportedLanguage } from "../../utils/language.util";
import { useLanguageStore } from "../../stores/languageStore";
import { Directory, File, Paths } from "expo-file-system";

/**
 * Convert an ArrayBuffer to a base64 string (React Native compatible).
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * TTSService – calls backend /tts/preview to generate audio from text.
 * Cache First: always checks audioCache before making network request.
 *
 * Language handling:
 * - When languageOverride is provided, the text is assumed to already be in that language
 *   (e.g. backend-translated content). sourceLanguage is set equal to target to prevent
 *   double-translation.
 * - When languageOverride is omitted, uses appLanguage from store and assumes text is
 *   in Vietnamese (source language). Backend will translate vi → targetLanguage.
 */
const CACHE_VERSION = 2; // Bumped: added sourceLanguage to cache key

class TTSService {
  constructor() {
    // One-time cache clear when cache version changes.
    // Old cache keys didn't include sourceLanguage → stale entries.
    this.migrateCache();
  }

  private async migrateCache(): Promise<void> {
    try {
      const cacheDir = new Directory(Paths.cache, "audio-cache");
      const versionFile = new File(cacheDir, ".cache-version");

      if (versionFile.exists) {
        const content = await versionFile.text();
        const currentVersion = parseInt(content ?? "0", 10);
        if (currentVersion >= CACHE_VERSION) return; // Already up to date
      }

      // Version mismatch or first run → clear all cached audio
      audioCache.clearAll();

      // Ensure directory exists and write version
      if (!cacheDir.exists) {
        cacheDir.create({ intermediates: true });
      }
      versionFile.write(String(CACHE_VERSION));
    } catch {
      // Non-critical — if migration fails, cache will just have extra entries
    }
  }

  /**
   * Generate (or retrieve from cache) audio for the given TTS text.
   *
   * @param poiId - used as cache key
   * @param ttsText - the text to convert to speech
   * @param languageOverride - when provided, text is already in this language.
   *   TTS will generate audio in this language WITHOUT re-translation.
   *   When omitted, uses appLanguage from store (text assumed to be in Vietnamese).
   * @returns local file URI ready for expo-av
   */
  async generateAudio(
    poiId: string,
    ttsText: string,
    languageOverride?: SupportedLanguage,
    sourceLanguageOverride?: SupportedLanguage,
  ): Promise<string> {
    // 1. Determine target language (what language to speak in)
    const targetLang =
      languageOverride ?? useLanguageStore.getState().appLanguage;

    // 2. Determine source language for cache key (must be included to avoid
    //    stale cache hits when same text + target but different source language)
    const effectiveSourceLang = sourceLanguageOverride
      ? sourceLanguageOverride
      : languageOverride
        ? targetLang
        : "vi";

    // 3. Build content-aware cache key (includes source lang + text hash)
    //    When TTS content changes on backend → hash changes → cache miss → fresh audio
    //    When source language differs → different key → correct re-generation
    const contentHash = audioCache.hashContent(ttsText);
    const cacheKey = audioCache.buildKey(
      poiId,
      `${targetLang}_${effectiveSourceLang}_${contentHash}`,
    );

    const cached = await audioCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 4. Determine source language (what language the text is written in):
    //    - If sourceLanguageOverride provided → text is in that specific language
    //      (e.g., ttsContent is Vietnamese but user wants English → translate vi→en)
    //    - If only languageOverride provided → text is already in target language
    //      (e.g., translatedContent from backend → no translation needed)
    //    - If no overrides → text is in Vietnamese (default source language)
    const sourceLang = effectiveSourceLang;

    // 5. Call backend TTS endpoint
    const ttsLang = toTtsLanguage(targetLang);

    const response = await axiosInstance.post(
      "/tts/preview",
      {
        text: ttsText,
        previewLanguage: ttsLang,
        sourceLanguage: sourceLang,
      },
      { responseType: "arraybuffer", timeout: 30_000 },
    );

    // 6. Convert binary response to base64
    const base64 = arrayBufferToBase64(response.data as ArrayBuffer);

    // 7. Save to cache and return file URI
    const fileUri = audioCache.set(cacheKey, base64);
    return fileUri;
  }

  /**
   * Download a remote audio file URL and cache it locally.
   * Used when poi.audioMode = 'file' and audioUrl is a remote https:// link.
   * @param poiId - cache key
   * @param audioUrl - remote URL
   * @returns local file URI
   */
  async downloadAndCache(poiId: string, audioUrl: string): Promise<string> {
    // 1. Cache first
    const cached = await audioCache.get(poiId);
    if (cached) return cached;

    // 2. Download binary
    const response = await axiosInstance.get(audioUrl, {
      responseType: "arraybuffer",
      timeout: 30_000,
      // Bypass base URL for absolute URLs
      baseURL: "",
    });

    // 3. Convert and cache
    const base64 = arrayBufferToBase64(response.data as ArrayBuffer);
    const fileUri = audioCache.set(poiId, base64);
    return fileUri;
  }

  /**
   * Evict cached audio for a POI (e.g. when POI content changes).
   */
  invalidateCache(poiId: string): void {
    audioCache.invalidate(poiId);
  }
}

// Singleton
export const ttsService = new TTSService();
