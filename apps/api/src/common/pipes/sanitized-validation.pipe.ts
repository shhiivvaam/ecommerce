import {
  ValidationPipe,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { SanitizationService } from '../utils/sanitization.service';

/**
 * Enhanced Validation Pipe with Input Sanitization
 */
export class SanitizedValidationPipe extends ValidationPipe {
  constructor(options?: any) {
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

  async transform(value: any, metadata: ArgumentMetadata) {
    // Sanitize input before validation
    const sanitizedValue = this.sanitizeInput(value, metadata);

    try {
      return await super.transform(sanitizedValue, metadata);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sanitize input based on metadata type
   */
  private sanitizeInput(value: any, metadata: ArgumentMetadata): any {
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
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'string') {
        sanitized[key] = SanitizationService.sanitizeString(val);
      } else if (typeof val === 'number') {
        sanitized[key] = SanitizationService.sanitizeNumber(val);
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map((item) =>
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
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (!body) return body;

    // If specific field is requested, sanitize only that field
    if (data) {
      const value = body[data];
      if (typeof value === 'string') {
        body[data] = SanitizationService.sanitizeString(value);
      } else if (Array.isArray(value)) {
        body[data] = SanitizationService.sanitizeStringArray(value);
      }
      return body;
    }

    // Sanitize entire body
    return SanitizationService.sanitizeObject(body);
  },
);
