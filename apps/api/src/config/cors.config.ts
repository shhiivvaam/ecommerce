import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Logger, ForbiddenException } from '@nestjs/common';

export const getCorsConfig = (): CorsOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logger = new Logger('CORS');

  // Guard: fail fast if FRONTEND_URL is missing in production.
  if (isProduction && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL env var is required in production');
  }

  // Support comma-separated FRONTEND_URLs
  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const productionOrigins: string[] = [
    ...envOrigins,
    'https://reyva.co.in',
    'https://www.reyva.co.in',
  ];

  const developmentOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  const allowedOrigins = isProduction
    ? productionOrigins
    : [...productionOrigins, ...developmentOrigins];

  return {
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server requests
      if (!requestOrigin) return callback(null, true);

      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked origin: ${requestOrigin}`);
        // Return null, false to avoid 500 error on preflight (let browser block it cleanly)
        // or resolve with an explicit ForbiddenException.
        callback(new ForbiddenException(`Origin ${requestOrigin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
    maxAge: 86400, // 24h cache
  };
};
