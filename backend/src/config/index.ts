import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif'
    ).split(','),
  },

  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'Audio Tour Guide <noreply@example.com>',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },

  request: {
    bodyLimitMb: parseInt(process.env.REQUEST_BODY_LIMIT_MB || '50', 10),
  },

  tts: {
    provider: (process.env.TTS_PROVIDER || 'xai') as 'xai' | 'google',
    fallbackProvider: (process.env.TTS_FALLBACK_PROVIDER || 'google') as 'xai' | 'google' | 'none',
    xaiApiKey: process.env.XAI_API_KEY || '',
    xaiVoiceId: process.env.XAI_TTS_VOICE_ID || 'eve',
    xaiTranslateModel: process.env.XAI_TRANSLATE_MODEL || 'grok-4',
    forceTranslationForExplicitLanguage: process.env.TTS_FORCE_TRANSLATION_FOR_EXPLICIT_LANGUAGE !== 'false',
  },
} as const;
