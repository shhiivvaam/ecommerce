import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  service: string;
  version?: string;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly serviceName: string;
  private readonly version: string;

  constructor(private configService: ConfigService) {
    this.serviceName = this.configService.get<string>(
      'SERVICE_NAME',
      'reyva-api',
    );
    this.version = this.configService.get<string>('APP_VERSION', '1.0.0');
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.serviceName,
      version: this.version,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
  }

  debug(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('debug', message, context);
    this.logger.debug(message, context);
    this.writeToExternalLogger(logEntry);
  }

  info(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('info', message, context);
    this.logger.log(message, context);
    this.writeToExternalLogger(logEntry);
  }

  warn(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('warn', message, context);
    this.logger.warn(message, context);
    this.writeToExternalLogger(logEntry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logEntry = this.createLogEntry('error', message, context, error);
    this.logger.error(message, error, context);
    this.writeToExternalLogger(logEntry);
  }

  // Log user actions for audit trail
  logUserAction(
    action: string,
    userId: string,
    context?: Partial<LogContext>,
  ): void {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...context,
    });
  }

  // Log security events
  logSecurityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: true,
    });
  }

  // Log performance metrics
  logPerformance(
    operation: string,
    duration: number,
    context?: LogContext,
  ): void {
    const level = duration > 1000 ? 'warn' : 'info';
    const message = `Performance: ${operation} took ${duration}ms`;

    if (level === 'warn') {
      this.warn(message, {
        ...context,
        operation,
        duration,
        performance: true,
      });
    } else {
      this.info(message, {
        ...context,
        operation,
        duration,
        performance: true,
      });
    }
  }

  // Log business events
  logBusinessEvent(event: string, data: unknown, context?: LogContext): void {
    this.info(`Business Event: ${event}`, {
      ...context,
      businessEvent: true,
      eventData: data,
    });
  }

  private writeToExternalLogger(logEntry: LogEntry): void {
    // In production, this would send logs to external services
    // like ELK stack, Datadog, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external logging service
      // this.sendToDatadog(logEntry);
      // this.sendToCloudWatch(logEntry);
      void JSON.stringify(logEntry); // serialise so logEntry is consumed; replace with real call
    }
  }

  // Structured logging for external systems
  createStructuredLog(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error,
  ): string {
    const logEntry = this.createLogEntry(level, message, context, error);
    return JSON.stringify(logEntry);
  }
}
