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

const parseCsv = (value: string | undefined): string[] => {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const frontendUrl = trimTrailingSlash(process.env.FRONTEND_URL || 'http://localhost:5173');
const publicApiBaseUrl = trimTrailingSlash(
  process.env.PUBLIC_API_BASE_URL
    || `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
);
const allowedOrigins = Array.from(new Set([
  frontendUrl,
  ...parseCsv(process.env.CORS_ORIGINS).map(trimTrailingSlash),
]));

export const config = {
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  port,
  host,
  publicApiBaseUrl,

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
    url: frontendUrl,
    allowedOrigins,
  },

  monitoring: {
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '500', 10),
    warningThresholdPercent: parseInt(process.env.MONITORING_WARNING_THRESHOLD_PERCENT || '80', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },
} as const;
