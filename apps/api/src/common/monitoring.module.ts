import { Module, MiddlewareConsumer, Scope } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { MetricsService } from './services/metrics.service';
import { HealthService } from './services/health.service';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

@Module({
  controllers: [HealthController, MetricsController],
  providers: [
    LoggingService,
    MetricsService,
    HealthService,
    LoggingInterceptor,
    PerformanceInterceptor,
    GlobalExceptionFilter,
    {
      provide: 'APP_FILTER',
      useClass: GlobalExceptionFilter,
      scope: Scope.REQUEST,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor,
      scope: Scope.REQUEST,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: PerformanceInterceptor,
      scope: Scope.REQUEST,
    },
  ],
  exports: [LoggingService, MetricsService, HealthService],
})
export class MonitoringModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
