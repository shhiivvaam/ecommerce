import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  startTime: number;
  method: string;
  url: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const context: RequestContext = {
      requestId: (req.headers['x-request-id'] as string) || uuidv4(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      startTime: Date.now(),
      method: req.method,
      url: req.url,
    };

    // Add context to request
    req.context = context;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', context.requestId);

    // Add logging for request start
    console.log(
      `[${context.requestId}] ${context.method} ${context.url} - Started`,
    );

    // Log request completion
    res.on('finish', () => {
      const duration = Date.now() - context.startTime;
      const { statusCode } = res;

      console.log(
        `[${context.requestId}] ${context.method} ${context.url} - ${statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
