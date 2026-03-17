import * as googleTTS from 'google-tts-api';
import { translate } from '@vitalets/google-translate-api';
import { AppError } from '../errors/app-error';

const PREVIEW_LANGUAGES = ['vi', 'en', 'zh'] as const;
type PreviewLanguage = typeof PREVIEW_LANGUAGES[number];

const isSupportedPreviewLanguage = (language: string): language is PreviewLanguage =>
  PREVIEW_LANGUAGES.includes(language as PreviewLanguage);

const mapLanguage = (languageCode: PreviewLanguage): string => {
  if (languageCode === 'zh') return 'zh-CN';
  return languageCode;
};

export const ttsService = {
  async generatePreviewAudio(text: string, previewLanguage: string, sourceLanguage = 'vi'): Promise<Buffer> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw AppError.badRequest('Text is required for TTS preview');
    }

    if (!isSupportedPreviewLanguage(previewLanguage)) {
      throw AppError.badRequest('Unsupported preview language. Allowed values: vi, en, zh');
    }

    const targetLanguage = previewLanguage;
    const normalizedSourceLanguage = isSupportedPreviewLanguage(sourceLanguage) ? sourceLanguage : 'vi';

    let spokenText = normalizedText;

    if (normalizedSourceLanguage !== targetLanguage) {
      try {
        const translated = await translate(normalizedText, {
          from: normalizedSourceLanguage,
          to: targetLanguage,
        });
        spokenText = translated.text?.trim() || normalizedText;
      } catch {
        // graceful fallback to original text if translation provider fails
        spokenText = normalizedText;
      }
    }

    const ttsUrl = googleTTS.getAudioUrl(spokenText, {
      lang: mapLanguage(targetLanguage),
      slow: false,
      host: 'https://translate.google.com',
    });

    const response = await fetch(ttsUrl);
    if (!response.ok) {
      throw AppError.badRequest('Unable to generate TTS preview at the moment');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },
};
