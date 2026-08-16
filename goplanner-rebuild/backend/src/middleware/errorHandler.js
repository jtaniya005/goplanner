import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.nodeEnv !== 'production' && statusCode >= 500 ? { stack: err.stack } : {})
  });
}
