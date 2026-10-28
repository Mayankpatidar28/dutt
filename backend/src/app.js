import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import assessmentRoutes from './modules/assessment/assessment.routes.js';
import conversationsRoutes from './modules/conversations/conversations.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import voiceRoutes from './modules/voice/voice.routes.js';
import learningRoutes from './modules/learning/learning.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allow frontend audio/speech APIs in dev
  }));

  // CORS configuration — supports comma-separated CLIENT_URL for multi-port dev
  const allowedOrigins = (env.CLIENT_URL || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }));

  // Rate Limiting: 120 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again in a minute.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    },
  });
  app.use('/api', limiter);

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
        durationMs: Date.now() - start,
        statusCode: res.statusCode,
      });
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'English Learning Dutt API',
      timestamp: new Date().toISOString(),
      aiProvider: env.AI_PROVIDER,
    });
  });

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/assessment', assessmentRoutes);
  app.use('/api/conversations', conversationsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/voice', voiceRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/progress', progressRoutes);

  // 404 Route Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      errorCode: 'ROUTE_NOT_FOUND',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();
