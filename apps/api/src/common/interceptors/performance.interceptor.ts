import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    const operation = `${method} ${url}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.loggingService.logPerformance(operation, duration, {
            method,
            url,
            success: true,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.loggingService.logPerformance(operation, duration, {
            method,
            url,
            success: false,
            error: error.message,
          });
        },
      }),
    );
  }
}
