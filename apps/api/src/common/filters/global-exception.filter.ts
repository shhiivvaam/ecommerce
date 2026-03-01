import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || message;
        errorDetails = (exceptionResponse as any).error || {};
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        message: exception.message,
      };
    }

    // Create error context
    const errorContext = {
      requestId: request.context?.requestId,
      userId: request.context?.userId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    // Log the error
    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.loggingService.error(
      `HTTP Exception: ${message}`,
      error,
      errorContext,
    );

    // Sanitize error response for production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: isDevelopment ? message : 'Something went wrong',
      requestId: request.context?.requestId,
      ...(isDevelopment && { error: errorDetails }),
    };

    response.status(status).json(errorResponse);
  }
}
