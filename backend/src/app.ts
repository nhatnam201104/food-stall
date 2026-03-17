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

const createApp = () => {
  const app = express();

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin: config.frontend.url,
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
