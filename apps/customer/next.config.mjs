import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Required for minimal Docker images
    output: 'standalone',
    // Prevent Next.js from looking into parent directories for lockfiles by defining root
    outputFileTracingRoot: path.join(__dirname, '../../'),
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
            { protocol: 'https', hostname: 'static.nike.com' },
            { protocol: 'https', hostname: 'media.endclothing.com' },
            { protocol: 'https', hostname: 'cdn.dribbble.com' },
            { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
            { protocol: 'https', hostname: '*.amazonaws.com' }
        ],
    },
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)',
                    },
                    {
                        key: 'Content-Security-Policy',
                        // Allows: same-origin scripts, Google Fonts, Stripe, Vercel, Razorpay
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https: *.tile.openstreetmap.org",
                            "connect-src 'self' http://localhost:* https://127.0.0.1:* https://api.reyva.co.in https://lumberjack.razorpay.com https://nominatim.openstreetmap.org https://api.postalpincode.in https://*.amazonaws.com",
                            "frame-src https://api.razorpay.com",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;

