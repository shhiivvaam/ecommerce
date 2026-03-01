import { Logger } from '@nestjs/common';

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
    target: object,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const logger = new Logger(
      `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`,
    );

    descriptor.value = async function (...args: unknown[]) {
      const className = (target as { constructor: { name: string } })
        .constructor.name;
      const methodName = propertyName;
      const startTime = Date.now();

      // Sanitize arguments for logging
      const sanitizedArgs = includeArgs
        ? sanitizeValue(args, sensitiveArgs)
        : undefined;

      // Log method start
      const logMessage = `${message} - ${className}.${methodName}`;

      if (level === 'warn') logger.warn(logMessage, sanitizedArgs);
      else if (level === 'error') logger.error(logMessage, sanitizedArgs);
      else if (level === 'debug') logger.debug(logMessage, sanitizedArgs);
      else logger.log(logMessage, sanitizedArgs);

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        // Sanitize result for logging
        const sanitizedResult = includeResult
          ? sanitizeValue(result, sensitiveResult)
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
          error instanceof Error ? error.stack : String(error),
          sanitizedArgs,
        );

        throw error;
      }
    };

    return descriptor;
  };
}

function sanitizeValue(value: unknown, sensitiveFields: string[]): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, sensitiveFields));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (
        sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(val, sensitiveFields);
      }
    }
    return sanitized;
  }

  return value;
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
