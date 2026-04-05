import * as googleTTS from 'google-tts-api';
import { translate } from '@vitalets/google-translate-api';
import { config } from '../config';
import { AppError } from '../errors/app-error';

const XAI_TTS_URL = 'https://api.x.ai/v1/tts';
const XAI_CHAT_COMPLETIONS_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_UNARY_MAX_CHARS = 15000;
const GOOGLE_UNARY_MAX_CHARS = 180;
const TRANSLATE_CHUNK_MAX_CHARS = 4000;
const GOOGLE_PREVIEW_LANGUAGES = ['vi', 'en', 'zh'] as const;
type GooglePreviewLanguage = typeof GOOGLE_PREVIEW_LANGUAGES[number];

const XAI_SUPPORTED_LANGUAGE_CODES = new Map<string, string>([
  ['auto', 'auto'],
  ['en', 'en'],
  ['ar-eg', 'ar-EG'],
  ['ar-sa', 'ar-SA'],
  ['ar-ae', 'ar-AE'],
  ['bn', 'bn'],
  ['zh', 'zh'],
  ['fr', 'fr'],
  ['de', 'de'],
  ['hi', 'hi'],
  ['id', 'id'],
  ['it', 'it'],
  ['ja', 'ja'],
  ['ko', 'ko'],
  ['pt-br', 'pt-BR'],
  ['pt-pt', 'pt-PT'],
  ['ru', 'ru'],
  ['es-mx', 'es-MX'],
  ['es-es', 'es-ES'],
  ['tr', 'tr'],
  ['vi', 'vi'],
]);

type TtsProviderName = 'xai' | 'google';

const LANGUAGE_LABELS: Record<string, string> = {
  auto: 'Auto detect',
  en: 'English',
  'ar-EG': 'Arabic (Egypt)',
  'ar-SA': 'Arabic (Saudi Arabia)',
  'ar-AE': 'Arabic (UAE)',
  bn: 'Bengali',
  zh: 'Chinese',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  ru: 'Russian',
  'es-MX': 'Spanish (Mexico)',
  'es-ES': 'Spanish (Spain)',
  tr: 'Turkish',
  vi: 'Vietnamese',
};

const isSupportedGooglePreviewLanguage = (language: string): language is GooglePreviewLanguage =>
  GOOGLE_PREVIEW_LANGUAGES.includes(language as GooglePreviewLanguage);

const mapGoogleLanguage = (languageCode: GooglePreviewLanguage): string => {
  if (languageCode === 'zh') return 'zh-CN';
  return languageCode;
};

const normalizeXaiLanguage = (language: string): string => {
  const normalized = language.trim().toLowerCase();
  return XAI_SUPPORTED_LANGUAGE_CODES.get(normalized) || 'auto';
};

const normalizeGoogleLanguage = (language: string): GooglePreviewLanguage => {
  const normalized = language.trim().toLowerCase();
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('vi')) return 'vi';
  if (isSupportedGooglePreviewLanguage(normalized)) return normalized;
  return 'vi';
};

const splitLongSegment = (segment: string, maxChars: number): string[] => {
  if (segment.length <= maxChars) {
    return [segment];
  }

  const sentenceParts = segment
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!sentenceParts.length) {
    const hardChunks: string[] = [];
    for (let index = 0; index < segment.length; index += maxChars) {
      hardChunks.push(segment.slice(index, index + maxChars));
    }
    return hardChunks;
  }

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentenceParts) {
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }

      for (let index = 0; index < sentence.length; index += maxChars) {
        chunks.push(sentence.slice(index, index + maxChars));
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }
    current = sentence;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const splitTextIntoChunks = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) {
    return [text];
  }

  const paragraphs = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return splitLongSegment(text, maxChars);
  }

  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(...splitLongSegment(paragraph, maxChars));
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const concatAudioBuffers = (buffers: Buffer[]): Buffer => {
  if (!buffers.length) {
    throw AppError.badRequest('No audio generated from TTS provider');
  }

  if (buffers.length === 1) {
    return buffers[0];
  }

  return Buffer.concat(buffers);
};

const normalizeLanguageForLabel = (language: string): string => {
  const normalized = language.trim();
  const fromMap = XAI_SUPPORTED_LANGUAGE_CODES.get(normalized.toLowerCase());
  return fromMap || normalized;
};

const toLanguageLabel = (language: string): string => {
  const normalized = normalizeLanguageForLabel(language);
  return LANGUAGE_LABELS[normalized] || normalized;
};

const extractChatMessageText = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices.length) return '';

  const firstChoice = choices[0] as { message?: { content?: unknown } };
  const content = firstChoice?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const textParts = content
      .map((part) => {
        if (!part || typeof part !== 'object') return '';
        const candidate = (part as { text?: unknown }).text;
        return typeof candidate === 'string' ? candidate : '';
      })
      .filter(Boolean);

    return textParts.join('').trim();
  }

  return '';
};

const translateChunkViaXai = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
): Promise<string> => {
  if (!config.tts.xaiApiKey) {
    throw new Error('XAI_API_KEY is missing');
  }

  const targetLabel = toLanguageLabel(targetLanguage);
  const sourceLabel = toLanguageLabel(sourceLanguage);

  const response = await fetch(XAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.tts.xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.tts.xaiTranslateModel,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: [
            'You are a precise translation engine for text-to-speech.',
            `Translate user text into ${targetLabel}.`,
            'Mandatory rules:',
            '- Keep person names, place names, addresses, organizations, product names, and brand names exactly as written.',
            '- Keep punctuation and sentence boundaries natural.',
            '- If parts are already in target language, keep/improve them naturally.',
            '- Do not add explanations, notes, or quotation marks.',
            '- Return only final translated text.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Source language hint: ${sourceLabel}\nTarget language: ${targetLabel}\n\nText:\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`xAI translate error (${response.status}): ${errorBody || 'unknown error'}`);
  }

  const payload = await response.json();
  const translated = extractChatMessageText(payload);
  if (!translated) {
    throw new Error('xAI translate returned empty content');
  }

  return translated;
};

const translateChunkViaGoogle = async (text: string, targetLanguage: string): Promise<string> => {
  const result = await translate(text, {
    from: 'auto',
    to: targetLanguage,
  });

  return result.text?.trim() || text;
};

const translateTextForSpeech = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
): Promise<string> => {
  if (targetLanguage === 'auto') {
    return text;
  }

  if (!config.tts.forceTranslationForExplicitLanguage) {
    return text;
  }

  const chunks = splitTextIntoChunks(text, TRANSLATE_CHUNK_MAX_CHARS);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    try {
      const translated = await translateChunkViaXai(chunk, targetLanguage, sourceLanguage);
      translatedChunks.push(translated);
      continue;
    } catch {
      // fallback to google translate for resilience
    }

    try {
      const translated = await translateChunkViaGoogle(chunk, targetLanguage);
      translatedChunks.push(translated);
    } catch {
      throw AppError.badRequest('Unable to translate mixed-language content for the selected preview language');
    }
  }

  return translatedChunks.join('\n\n').trim() || text;
};

const synthesizeViaXai = async (text: string, language: string): Promise<Buffer> => {
  if (!config.tts.xaiApiKey) {
    throw new Error('XAI_API_KEY is missing');
  }

  const chunks = splitTextIntoChunks(text, XAI_UNARY_MAX_CHARS);
  const audioChunks: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await fetch(XAI_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.tts.xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: chunk,
        voice_id: config.tts.xaiVoiceId,
        language,
        output_format: {
          codec: 'mp3',
          sample_rate: 24000,
          bit_rate: 128000,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`xAI TTS error (${response.status}): ${errorBody || 'unknown error'}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    audioChunks.push(Buffer.from(arrayBuffer));
  }

  return concatAudioBuffers(audioChunks);
};

const synthesizeViaGoogle = async (text: string, speechLanguage: string): Promise<Buffer> => {
  const targetLanguage = normalizeGoogleLanguage(speechLanguage);
  const chunks = splitTextIntoChunks(text, GOOGLE_UNARY_MAX_CHARS);
  const audioChunks: Buffer[] = [];

  for (const chunk of chunks) {
    const ttsUrl = googleTTS.getAudioUrl(chunk, {
      lang: mapGoogleLanguage(targetLanguage),
      slow: false,
      host: 'https://translate.google.com',
    });

    const response = await fetch(ttsUrl);
    if (!response.ok) {
      throw new Error(`Google TTS error (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    audioChunks.push(Buffer.from(arrayBuffer));
  }

  return concatAudioBuffers(audioChunks);
};

const resolveProviderOrder = (): TtsProviderName[] => {
  const primaryProvider = config.tts.provider;
  const fallbackProvider = config.tts.fallbackProvider;

  if (fallbackProvider === 'none' || fallbackProvider === primaryProvider) {
    return [primaryProvider];
  }

  return [primaryProvider, fallbackProvider as TtsProviderName];
};

export const ttsService = {
  async generatePreviewAudio(text: string, previewLanguage: string, sourceLanguage = 'vi'): Promise<Buffer> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw AppError.badRequest('Text is required for TTS preview');
    }

    const providerOrder = resolveProviderOrder();
    const xaiLanguage = normalizeXaiLanguage(previewLanguage);
    const translatedText = await translateTextForSpeech(normalizedText, xaiLanguage, sourceLanguage);
    const errors: string[] = [];

    for (const provider of providerOrder) {
      try {
        if (provider === 'xai') {
          return await synthesizeViaXai(translatedText, xaiLanguage);
        }

        const googleSpeechLanguage = xaiLanguage === 'auto' ? sourceLanguage : xaiLanguage;
        return await synthesizeViaGoogle(translatedText, googleSpeechLanguage);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown TTS provider error';
        errors.push(`${provider}: ${message}`);
      }
    }

    throw AppError.badRequest(`Unable to generate TTS preview at the moment (${errors.join(' | ')})`);
  },
};
