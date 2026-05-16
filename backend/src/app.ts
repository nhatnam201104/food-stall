import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { config } from './config';
import { globalLimiter } from './middleware/rate-limit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import apiRoutes from './routes/index';

const TRUSTED_ORIGIN_SUFFIXES = [
  '.expo.dev',
  '.exp.direct',
  '.devtunnels.ms',
  '.ngrok.io',
  '.ngrok-free.app',
  '.trycloudflare.com',
];

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin || config.env !== 'production') return true;
  if (config.frontend.allowedOrigins.includes(origin.replace(/\/+$/, ''))) return true;

  try {
    const { hostname } = new URL(origin);
    return TRUSTED_ORIGIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
      || hostname === 'localhost'
      || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const createApp = () => {
  const app = express();

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ─── Rate limiting ─────────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ─── Request parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // ─── Logging ───────────────────────────────────────────────────────────────
  if (config.env !== 'test') {
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  }

  // ─── Static files (uploads) ────────────────────────────────────────────────
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), config.upload.dir), {
      setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  // ─── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
  });

  // ─── API Routes ────────────────────────────────────────────────────────────
  // Disable ETag-based caching for all API responses to prevent 304 Not Modified
  app.use('/api/v1', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/v1', apiRoutes);

  // ─── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // ─── Global error handler ───────────────────────────────────────────────────
  app.use(errorMiddleware);

  return app;
};

export default createApp;
