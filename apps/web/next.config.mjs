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
        ],
    },
};

export default nextConfig;
