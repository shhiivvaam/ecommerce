import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Logger } from '@nestjs/common';

export const getCorsConfig = (): CorsOptions => {
    const isProduction = process.env.NODE_ENV === 'production';
    const logger = new Logger('CORS');

    // Guard: fail fast if FRONTEND_URL is missing in production.
    if (isProduction && !process.env.FRONTEND_URL) {
        throw new Error('FRONTEND_URL env var is required in production');
    }

    const productionOrigins: string[] = [
        process.env.FRONTEND_URL, // e.g. https://reyva.vercel.app
    ].filter(Boolean) as string[];

    const developmentOrigins: string[] = [
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    const allowedOrigins = isProduction
        ? productionOrigins
        : [...productionOrigins, ...developmentOrigins];

    return {
        origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Allow server-to-server requests
            if (!requestOrigin) return callback(null, true);

            if (allowedOrigins.includes(requestOrigin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked origin: ${requestOrigin}`);
                callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
            }
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Cookie',
            'Accept',
            'X-Requested-With',
        ],
        credentials: true,
        maxAge: 86400, // 24h cache
    };
};
