import axiosInstance from '../../configs/axios.config';
import { audioCache } from './AudioCache';
import { detectDeviceLanguage, toTtsLanguage } from '../../utils/language.util';
import type { SupportedLanguage } from '../../utils/language.util';

/**
 * Convert an ArrayBuffer to a base64 string (React Native compatible).
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
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
 * Uses device language for TTS generation.
 */
class TTSService {
  /**
   * Generate (or retrieve from cache) audio for the given TTS text.
   * Uses the device's detected language.
   * @param poiId - used as cache key
   * @param ttsText - the text to convert to speech
   * @param languageOverride - optional override for language (defaults to device locale)
   * @returns local file URI ready for expo-av
   */
  async generateAudio(
    poiId: string,
    ttsText: string,
    languageOverride?: SupportedLanguage,
  ): Promise<string> {
    // 1. Cache first (key includes language for multilingual support)
    const deviceLang = languageOverride ?? detectDeviceLanguage();
    const cacheKey = `${poiId}_${deviceLang}`;
    const cached = await audioCache.get(cacheKey);
    if (cached) return cached;

    // 2. Call backend TTS endpoint with device language
    const ttsLang = toTtsLanguage(deviceLang);
    const response = await axiosInstance.post(
      '/tts/preview',
      {
        text: ttsText,
        previewLanguage: ttsLang,
        sourceLanguage: deviceLang,
      },
      { responseType: 'arraybuffer', timeout: 30_000 },
    );

    // 3. Convert binary response to base64
    const base64 = arrayBufferToBase64(response.data as ArrayBuffer);

    // 4. Save to cache and return file URI
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
      responseType: 'arraybuffer',
      timeout: 30_000,
      // Bypass base URL for absolute URLs
      baseURL: '',
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
