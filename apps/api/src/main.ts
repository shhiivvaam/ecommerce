import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Configs
import { getCorsConfig } from './config/cors.config';
import { setupSwagger } from './config/swagger.config';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  // 1. Security & Middleware
  app.use(helmet());
  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  // 1.5 Validation & Error Handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties without decorators
      transform: true, // Automatically transform payload to DTO instances
      forbidNonWhitelisted: true, // Throw an error if extraneous properties are provided
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // 2. Global Route Prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // 3. API Documentation
  setupSwagger(app);

  // 4. Start Server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 E-Commerce API running on port ${port}`);
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('Failed to bootstrap application', {
    error: errorMessage,
  });
});
