import * as googleTTS from "google-tts-api";
import { translate as googleTranslate } from "@vitalets/google-translate-api";
import translateClient from "@iamtraction/google-translate";
import { AppError } from "../errors/app-error";

// ─── Supported languages (ISO 639-1 base codes) ──────────────────────────────
const PREVIEW_LANGUAGES = [
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
] as const;
type PreviewLanguage = (typeof PREVIEW_LANGUAGES)[number];

const isSupportedPreviewLanguage = (
  language: string,
): language is PreviewLanguage =>
  PREVIEW_LANGUAGES.includes(language as PreviewLanguage);

/**
 * Normalize a BCP-47 language tag (e.g. 'ja-JP', 'fr-FR', 'zh-Hans-CN')
 * to a supported ISO 639-1 base code (e.g. 'ja', 'fr', 'zh').
 * Falls back to 'vi' if no match found.
 */
export const normalizeLanguageCode = (raw: string): string => {
  if (!raw || typeof raw !== "string") return "vi";

  const lower = raw.trim().toLowerCase();

  // Direct match (e.g. 'vi', 'en', 'ja')
  if (isSupportedPreviewLanguage(lower)) return lower;

  // Extract base code from BCP-47 (e.g. 'ja-JP' → 'ja', 'zh-Hans' → 'zh')
  const base = lower.split("-")[0];
  if (isSupportedPreviewLanguage(base)) return base;

  // Special mappings for common variants
  const specialMappings: Record<string, string> = {
    "zh-hans": "zh",
    "zh-hant": "zh",
    "zh-cn": "zh",
    "zh-tw": "zh",
    "pt-br": "pt",
    "en-us": "en",
    "en-gb": "en",
  };
  const mapped = specialMappings[lower];
  if (mapped && isSupportedPreviewLanguage(mapped)) return mapped;

  return "vi"; // Default fallback
};

/**
 * Map a base language code to the format expected by google-tts-api.
 * Some languages need full BCP-47 codes for TTS.
 */
const mapLanguageForTTS = (languageCode: PreviewLanguage): string => {
  const ttsMap: Record<PreviewLanguage, string> = {
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
  return ttsMap[languageCode];
};

// ─── Translation Cache ────────────────────────────────────────────────────────
interface CacheEntry {
  translatedText: string;
  timestamp: number;
}

const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

class TranslationCache {
  private cache = new Map<string, CacheEntry>();

  buildKey(text: string, from: string, to: string): string {
    return `${from}:${to}:${text}`;
  }

  get(text: string, from: string, to: string): string | null {
    const key = this.buildKey(text, from, to);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.translatedText;
  }

  set(text: string, from: string, to: string, translatedText: string): void {
    const key = this.buildKey(text, from, to);

    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { translatedText, timestamp: Date.now() });
  }
}

const translationCache = new TranslationCache();

const GOOGLE_TTS_SAFE_CHUNK_SIZE = 180;

const splitLongToken = (token: string, maxLength: number): string[] => {
  if (token.length <= maxLength) return [token];

  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += maxLength) {
    chunks.push(token.slice(i, i + maxLength));
  }
  return chunks;
};

const splitTextForGoogleTts = (
  text: string,
  maxLength = GOOGLE_TTS_SAFE_CHUNK_SIZE,
): string[] => {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const chunked: string[] = [];
  const paragraphs = normalized
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const pushByWords = (value: string) => {
    const words = value.split(" ").filter(Boolean);
    let current = "";

    for (const word of words) {
      if (word.length > maxLength) {
        if (current) {
          chunked.push(current);
          current = "";
        }
        chunked.push(...splitLongToken(word, maxLength));
        continue;
      }

      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxLength) {
        current = candidate;
      } else {
        if (current) chunked.push(current);
        current = word;
      }
    }

    if (current) chunked.push(current);
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunked.push(paragraph);
      continue;
    }

    const sentences = paragraph
      .split(/(?<=[.!?。！？])\s+/u)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!sentences.length) {
      pushByWords(paragraph);
      continue;
    }

    let currentSentenceChunk = "";
    for (const sentence of sentences) {
      if (sentence.length > maxLength) {
        if (currentSentenceChunk) {
          chunked.push(currentSentenceChunk);
          currentSentenceChunk = "";
        }
        pushByWords(sentence);
        continue;
      }

      const candidate = currentSentenceChunk
        ? `${currentSentenceChunk} ${sentence}`
        : sentence;

      if (candidate.length <= maxLength) {
        currentSentenceChunk = candidate;
      } else {
        if (currentSentenceChunk) chunked.push(currentSentenceChunk);
        currentSentenceChunk = sentence;
      }
    }

    if (currentSentenceChunk) chunked.push(currentSentenceChunk);
  }

  return chunked.filter(Boolean);
};

const fetchGoogleTtsChunk = async (
  text: string,
  languageCode: PreviewLanguage,
): Promise<Buffer> => {
  const ttsUrl = googleTTS.getAudioUrl(text, {
    lang: mapLanguageForTTS(languageCode),
    slow: false,
    host: "https://translate.google.com",
  });

  const response = await fetch(ttsUrl);
  if (!response.ok) {
    throw new Error(`Google TTS request failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// ─── Retry Utility ────────────────────────────────────────────────────────────
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on non-rate-limit errors
      const errorMessage = lastError.message;
      const isRateLimit =
        errorMessage.includes("Too Many Requests") ||
        errorMessage.includes("429") ||
        errorMessage.includes("rate limit");

      if (!isRateLimit || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs,
      );
      console.warn(
        `[TTS RETRY] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
        { error: errorMessage.substring(0, 100) },
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// ─── Translation Providers ────────────────────────────────────────────────────

/**
 * Primary translation using @vitalets/google-translate-api
 */
async function translateWithVitalets(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const result = await googleTranslate(text, { from, to });
  return result.text?.trim() || text;
}

/**
 * Fallback translation using @iamtraction/google-translate
 * Uses a different endpoint, less likely to hit same rate limit.
 */
async function translateWithIamTraction(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const result = await translateClient(text, { from, to });
  return result.text?.trim() || text;
}

export const ttsService = {
  /**
   * Translate text from sourceLanguage to targetLanguage.
   * Uses cache first, then primary provider with retry, then fallback provider.
   * Returns the translated text, or throws if all methods fail.
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage = "vi",
  ): Promise<string> {
    const normalizedText = text.trim();
    if (!normalizedText) return normalizedText;

    const normalizedTarget = normalizeLanguageCode(targetLanguage);
    const normalizedSource = normalizeLanguageCode(sourceLanguage);

    if (!isSupportedPreviewLanguage(normalizedTarget)) {
      return normalizedText;
    }
    if (!isSupportedPreviewLanguage(normalizedSource)) {
      return normalizedText;
    }
    if (normalizedSource === normalizedTarget) {
      return normalizedText;
    }

    // Check cache first
    const cached = translationCache.get(
      normalizedText,
      normalizedSource,
      normalizedTarget,
    );
    if (cached) {
      console.log("[TTS CACHE] Hit:", {
        from: normalizedSource,
        to: normalizedTarget,
        textPreview: normalizedText.substring(0, 40),
      });
      return cached;
    }

    console.log("[TTS TRANSLATE] Translating:", {
      from: normalizedSource,
      to: normalizedTarget,
      textPreview: normalizedText.substring(0, 80),
    });

    // Try primary provider with retry
    try {
      const translated = await withRetry(
        () =>
          translateWithVitalets(
            normalizedText,
            normalizedSource,
            normalizedTarget,
          ),
        { maxRetries: 2 },
      );
      console.log("[TTS TRANSLATE] Primary success:", {
        translatedText: translated.substring(0, 80),
      });
      translationCache.set(
        normalizedText,
        normalizedSource,
        normalizedTarget,
        translated,
      );
      return translated;
    } catch (primaryError) {
      const primaryMsg =
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError);
      console.warn("[TTS TRANSLATE] Primary provider failed:", {
        error: primaryMsg.substring(0, 120),
      });

      // Try fallback provider
      try {
        const translated = await translateWithIamTraction(
          normalizedText,
          normalizedSource,
          normalizedTarget,
        );
        console.log("[TTS TRANSLATE] Fallback success:", {
          translatedText: translated.substring(0, 80),
        });
        translationCache.set(
          normalizedText,
          normalizedSource,
          normalizedTarget,
          translated,
        );
        return translated;
      } catch (fallbackError) {
        const fallbackMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error("[TTS TRANSLATE] FAILED: Both providers exhausted:", {
          primaryError: primaryMsg.substring(0, 80),
          fallbackError: fallbackMsg.substring(0, 80),
        });
        // Return original text as last resort
        return normalizedText;
      }
    }
  },

  async generatePreviewAudio(
    text: string,
    previewLanguage: string,
    sourceLanguage = "vi",
  ): Promise<Buffer> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw AppError.badRequest("Text is required for TTS preview");
    }

    const targetLanguage = normalizeLanguageCode(previewLanguage);
    const normalizedSourceLanguage = normalizeLanguageCode(sourceLanguage);

    if (!isSupportedPreviewLanguage(targetLanguage)) {
      throw AppError.badRequest(
        `Unsupported preview language: ${previewLanguage}. Allowed values: ${PREVIEW_LANGUAGES.join(", ")}`,
      );
    }

    let spokenText = normalizedText;
    let translationFailed = false;

    if (normalizedSourceLanguage !== targetLanguage) {
      console.log("[TTS DEBUG] Need translation:", {
        source: normalizedSourceLanguage,
        target: targetLanguage,
        textPreview: normalizedText.substring(0, 80),
      });

      const translated = await this.translateText(
        normalizedText,
        targetLanguage,
        normalizedSourceLanguage,
      );

      // Detect if translation actually failed (returned same text in different language request)
      if (translated === normalizedText) {
        translationFailed = true;
        console.warn(
          "[TTS WARN] Translation returned original text — likely failed. Will generate TTS in source language.",
        );
      } else {
        spokenText = translated;
      }
    }

    // Use source language for TTS if translation failed, to avoid garbled output
    const ttsLanguage = translationFailed
      ? normalizedSourceLanguage
      : targetLanguage;

    console.log("Generating TTS for text:", {
      spokenText: spokenText.substring(0, 80),
      targetLanguage: ttsLanguage,
      translationFailed,
    });

    const chunks = splitTextForGoogleTts(spokenText);
    if (!chunks.length) {
      throw AppError.badRequest("Text is required for TTS preview");
    }

    console.log("[TTS CHUNK] Split text for preview", {
      sourceLength: spokenText.length,
      chunks: chunks.length,
      chunkSizeLimit: GOOGLE_TTS_SAFE_CHUNK_SIZE,
    });

    const buffers: Buffer[] = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      try {
        const chunkBuffer = await withRetry(
          () =>
            fetchGoogleTtsChunk(chunk, ttsLanguage as PreviewLanguage),
          { maxRetries: 2 },
        );
        buffers.push(chunkBuffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[TTS CHUNK] Failed to generate chunk", {
          chunkIndex: index,
          totalChunks: chunks.length,
          message: message.substring(0, 140),
        });
        throw AppError.badRequest("Unable to generate TTS preview at the moment");
      }
    }

    return Buffer.concat(buffers);
  },
};
