import * as googleTTS from "google-tts-api";
import { translate as googleTranslate } from "@vitalets/google-translate-api";
import translateClient from "@iamtraction/google-translate";
import { AppError } from "../errors/app-error";

export const normalizeLanguageCode = (raw: string): string => {
  if (!raw || typeof raw !== "string") return "vi";
  const normalized = raw.trim().toLowerCase().replace(/_/g, "-");
  const base = normalized.split("-")[0]?.trim();
  if (!base || !/^[a-z]{2,8}$/i.test(base)) return "vi";
  return base;
};

const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 30 * 60 * 1000;
const GOOGLE_TTS_SAFE_CHUNK_SIZE = 180;

type CacheValue = { value: string; timestamp: number };
const translationCache = new Map<string, CacheValue>();

const buildCacheKey = (text: string, from: string, to: string): string =>
  `${from}:${to}:${text}`;

const getCachedTranslation = (
  text: string,
  from: string,
  to: string,
): string | null => {
  const key = buildCacheKey(text, from, to);
  const entry = translationCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedTranslation = (
  text: string,
  from: string,
  to: string,
  value: string,
): void => {
  const key = buildCacheKey(text, from, to);
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  translationCache.set(key, { value, timestamp: Date.now() });
};

const chunkTextSimple = (text: string, size = GOOGLE_TTS_SAFE_CHUNK_SIZE): string[] => {
  const normalized = text.replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += size) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
};

const fetchAudio = async (text: string, languageCode: string): Promise<Buffer> => {
  const ttsUrl = googleTTS.getAudioUrl(text, {
    lang: languageCode,
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

export const ttsService = {
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage = "auto",
  ): Promise<string> {
    const normalizedText = text.trim();
    if (!normalizedText) return normalizedText;

    const normalizedTarget = normalizeLanguageCode(targetLanguage);
    const normalizedSource = normalizeLanguageCode(sourceLanguage);
    if (normalizedSource === normalizedTarget) {
      return normalizedText;
    }

    const cached = getCachedTranslation(
      normalizedText,
      normalizedSource,
      normalizedTarget,
    );
    if (cached) {
      return cached;
    }

    try {
      const primary = await googleTranslate(normalizedText, {
        from: normalizedSource,
        to: normalizedTarget,
      });
      const translated = primary.text?.trim() || normalizedText;
      setCachedTranslation(
        normalizedText,
        normalizedSource,
        normalizedTarget,
        translated,
      );
      return translated;
    } catch {
      try {
        const fallback = await translateClient(
          normalizedText,
          { from: normalizedSource, to: normalizedTarget },
        );
        const translated = fallback.text?.trim() || normalizedText;
        setCachedTranslation(
          normalizedText,
          normalizedSource,
          normalizedTarget,
          translated,
        );
        return translated;
      } catch {
        return normalizedText;
      }
    }
  },

  async generatePreviewAudio(
    text: string,
    previewLanguage: string,
    sourceLanguage = "auto",
  ): Promise<Buffer> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw AppError.badRequest("Text is required for TTS preview");
    }

    const targetLanguage = normalizeLanguageCode(previewLanguage);
    const normalizedSourceLanguage = normalizeLanguageCode(sourceLanguage);

    let spokenText = normalizedText;
    let ttsLanguage = targetLanguage;

    if (normalizedSourceLanguage !== targetLanguage) {
      const translated = await this.translateText(
        normalizedText,
        targetLanguage,
        normalizedSourceLanguage,
      );

      if (translated !== normalizedText) {
        spokenText = translated;
      } else {
        ttsLanguage =
          normalizedSourceLanguage === "auto"
            ? targetLanguage
            : normalizedSourceLanguage;
      }
    }

    const chunks = chunkTextSimple(spokenText);
    if (!chunks.length) {
      throw AppError.badRequest("Text is required for TTS preview");
    }

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      try {
        const chunkBuffer = await fetchAudio(chunk, ttsLanguage);
        buffers.push(chunkBuffer);
      } catch {
        // Fallback to source language if target language fails on TTS provider.
        if (ttsLanguage !== normalizedSourceLanguage) {
          const fallbackChunk = await fetchAudio(chunk, normalizedSourceLanguage);
          buffers.push(fallbackChunk);
          continue;
        }
        throw AppError.badRequest("Unable to generate TTS preview at the moment");
      }
    }

    return Buffer.concat(buffers);
  },
};
