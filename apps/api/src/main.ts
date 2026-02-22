import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());

  const isProduction = process.env.NODE_ENV === 'production';

  // ── CORS Allowlist ──────────────────────────────────────────────────────────
  // Production : only the deployed frontend domain is allowed.
  // Development: add localhost ports for local testing.
  // Any origin NOT in this list gets a CORS error — browser blocks the request.

  // Guard: fail fast if FRONTEND_URL is missing in production.
  // Without it, productionOrigins would be empty → your own frontend gets blocked.
  if (isProduction && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL env var is required in production');
  }

  const productionOrigins: string[] = [
    process.env.FRONTEND_URL, // e.g. https://reyva.vercel.app
  ].filter(Boolean) as string[];

  const developmentOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const allowedOrigins = isProduction
    ? productionOrigins
    : [...productionOrigins, ...developmentOrigins];

  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server requests (no Origin header — e.g. curl, Postman, mobile)
      if (!requestOrigin) return callback(null, true);

      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        logger.warn(`[CORS] Blocked origin: ${requestOrigin}`);
        callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
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
    maxAge: 86400, // cache preflight for 24h — browser won't re-send OPTIONS every request
  });

  app.use(cookieParser());

  // Global prefix — /health is excluded so it stays at root (not /api/health)
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger Documentation (available at /api/docs)
  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Full-stack Modern E-Commerce Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
