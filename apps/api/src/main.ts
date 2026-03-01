import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Configs
import { getCorsConfig } from './config/cors.config';
import { setupSwagger } from './config/swagger.config';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { SanitizedValidationPipe } from './common/pipes/sanitized-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Security & Middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  // 1.5 Validation & Error Handling with Sanitization
  app.useGlobalPipes(new SanitizedValidationPipe());
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // 2. Global Route Prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // 3. API Documentation
  setupSwagger(app);

  // 4. Start Server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 E-Commerce API running on port ${port}`);
  logger.log(
    `🔒 Security features enabled: Helmet, Input Sanitization, CSRF Protection`,
  );
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('Failed to bootstrap application', {
    error: errorMessage,
  });
});
