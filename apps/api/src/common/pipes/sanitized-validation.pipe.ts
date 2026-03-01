import {
  ValidationPipe,
  BadRequestException,
  ArgumentMetadata,
  ValidationPipeOptions,
} from '@nestjs/common';
import { SanitizationService } from '../utils/sanitization.service';

/**
 * Enhanced Validation Pipe with Input Sanitization
 */
export class SanitizedValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true, // Strips out properties without decorators
      transform: true, // Automatically transform payload to DTO instances
      forbidNonWhitelisted: true, // Throw an error if extraneous properties are provided
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          })),
        }),
      ...options,
    });
  }

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    // Sanitize input before validation
    const sanitizedValue = this.sanitizeInput(value, metadata);

    return super.transform(sanitizedValue, metadata);
  }

  /**
   * Sanitize input based on metadata type
   */
  private sanitizeInput(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // If it's a primitive type, return as-is (validation will handle it)
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    // Sanitize object recursively
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeInput(item, metadata));
    }

    // For objects, sanitize each property
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string') {
        sanitized[key] = SanitizationService.sanitizeString(val);
      } else if (typeof val === 'number') {
        sanitized[key] = SanitizationService.sanitizeNumber(val);
      } else if (Array.isArray(val)) {
        sanitized[key] = (val as unknown[]).map((item) =>
          typeof item === 'string'
            ? SanitizationService.sanitizeString(item)
            : item,
        );
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = this.sanitizeInput(val, metadata);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }
}

/**
 * Custom decorator for sanitizing specific fields
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SanitizedBody = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ body: Record<string, unknown> }>();
    const bodyStr = request.body;

    if (!bodyStr) return bodyStr;

    // If specific field is requested, sanitize only that field
    if (data) {
      const value = bodyStr[data];
      if (typeof value === 'string') {
        bodyStr[data] = SanitizationService.sanitizeString(value);
      } else if (Array.isArray(value)) {
        bodyStr[data] = SanitizationService.sanitizeStringArray(
          value as string[],
        );
      }
      return bodyStr;
    }

    // Sanitize entire body
    return SanitizationService.sanitizeObject(bodyStr);
  },
);
