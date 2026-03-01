import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * CSRF Protection Middleware
 * Uses double submit cookie pattern for stateless CSRF protection
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfCookieName = 'x-csrf-token';
  private readonly csrfHeaderName = 'x-csrf-token';
  private readonly tokenLength = 32;

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS requests (they are safe)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      this.generateCsrfToken(req, res);
      return next();
    }

    // For state-changing requests, validate CSRF token
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!this.validateCsrfToken(req)) {
        throw new ForbiddenException('CSRF token validation failed');
      }
    }

    next();
  }

  /**
   * Generate and set CSRF token in cookie
   */
  private generateCsrfToken(req: Request, res: Response): void {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies[this.csrfCookieName] ?? this.generateToken();

    // Set CSRF token in HTTP-only cookie
    res.cookie(this.csrfCookieName, token, {
      httpOnly: false, // Client needs to read this for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Also set token in response header for easy access
    res.set(this.csrfHeaderName, token);
  }

  /**
   * Validate CSRF token from request
   */
  private validateCsrfToken(req: Request): boolean {
    const cookies = req.cookies as Record<string, string | undefined>;
    const cookieToken: string | undefined = cookies[this.csrfCookieName];
    const headerToken = req.headers[this.csrfHeaderName] as string | undefined;

    // Allow requests if both tokens are missing (for API usage)
    if (!cookieToken && !headerToken) {
      return true;
    }

    // Validate that tokens match
    return cookieToken === headerToken;
  }

  /**
   * Generate a random CSRF token
   */
  private generateToken(): string {
    return randomBytes(this.tokenLength).toString('hex');
  }
}

/**
 * CSRF Guard for protecting specific routes
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const cookies = request.cookies as Record<string, string | undefined>;
    const cookieToken: string | undefined = cookies['x-csrf-token'];
    const headerToken = request.headers['x-csrf-token'] as string | undefined;

    // Allow requests if both tokens are missing (for API usage)
    if (!cookieToken && !headerToken) {
      return true;
    }

    // Validate that tokens match
    if (cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token validation failed');
    }

    return true;
  }
}
