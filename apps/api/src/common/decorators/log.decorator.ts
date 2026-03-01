import { Logger } from '@nestjs/common';
import { LoggingService } from '../services/logging.service';

export interface LogOptions {
  message?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  includeArgs?: boolean;
  includeResult?: boolean;
  sensitiveArgs?: string[];
  sensitiveResult?: string[];
}

export function Log(options: LogOptions = {}) {
  const {
    message = 'Method execution',
    level = 'info',
    includeArgs = true,
    includeResult = false,
    sensitiveArgs = ['password', 'token', 'secret', 'key'],
    sensitiveResult = ['password', 'token', 'secret', 'key'],
  } = options;

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyName;
      const startTime = Date.now();

      // Sanitize arguments for logging
      const sanitizedArgs = includeArgs
        ? sanitizeObject(args, sensitiveArgs)
        : undefined;

      // Log method start
      const logMessage = `${message} - ${className}.${methodName}`;
      logger.log(logMessage, sanitizedArgs);

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        // Sanitize result for logging
        const sanitizedResult = includeResult
          ? sanitizeObject(result, sensitiveResult)
          : undefined;

        // Log successful completion
        logger.log(
          `${logMessage} - Completed (${duration}ms)`,
          sanitizedResult,
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log error
        logger.error(
          `${logMessage} - Failed (${duration}ms)`,
          error instanceof Error ? error.stack : error,
          sanitizedArgs,
        );

        throw error;
      }
    };

    return descriptor;
  };
}

function sanitizeObject(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Specialized decorators for common use cases
export function LogMethod(message?: string) {
  return Log({ message, includeArgs: true, includeResult: false });
}

export function LogMethodWithResult(message?: string) {
  return Log({ message, includeArgs: true, includeResult: true });
}

export function LogPerformance(message?: string) {
  return Log({
    message: message || 'Performance tracking',
    level: 'info',
    includeArgs: false,
    includeResult: false,
  });
}

export function LogSecurity(message?: string) {
  return Log({
    message: message || 'Security operation',
    level: 'warn',
    includeArgs: false,
    includeResult: false,
    sensitiveArgs: ['password', 'token', 'secret', 'key', 'credential'],
    sensitiveResult: [
      'password',
      'token',
      'secret',
      'key',
      'credential',
      'session',
    ],
  });
}
