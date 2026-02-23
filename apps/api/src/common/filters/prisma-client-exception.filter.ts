import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal database error';

    // Log the error details for server diagnostics
    this.logger.error(`${request.method} ${request.url}`, exception.stack);

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const targetMeta = exception.meta?.target;
        const target = Array.isArray(targetMeta)
          ? targetMeta.join(', ')
          : typeof targetMeta === 'string'
            ? targetMeta
            : 'unknown target';
        message = `Unique constraint failed on the fields: (${target})`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found to update or delete';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        break;
      }
      default:
        // Use generic 500 status and message for unaccounted errors but log the specifics
        this.logger.warn(`Unhandled Prisma Code: ${exception.code}`);
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
