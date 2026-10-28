import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    logger.warn(`Handled error [${err.errorCode}]: ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    logger.error(`Database error [${err.code}]`, { path: req.originalUrl, method: req.method });
    
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with that unique field already exists.',
        errorCode: 'CONFLICT_ERROR',
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Requested record was not found.',
        errorCode: 'RESOURCE_NOT_FOUND',
      });
    }
  }

  // Unhandled / Unexpected error
  logger.error(`Unhandled exception: ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : 'An unexpected error occurred. Please try again later.',
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
}
