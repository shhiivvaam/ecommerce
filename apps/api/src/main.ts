import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Configs
import { getCorsConfig } from './config/cors.config';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
1
  // 1. Security & Middleware
  app.use(helmet());
  app.enableCors(getCorsConfig());
  app.use(cookieParser());

  // 2. Global Route Prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // 3. API Documentation
  setupSwagger(app);

  // 4. Start Server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 E-Commerce API running on port ${port}`);
}
bootstrap();
