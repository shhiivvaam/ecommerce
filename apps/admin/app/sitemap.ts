import type { MetadataRoute } from 'next';

// The admin portal is entirely private — no public-facing sitemap.
// robots: noindex is set in layout.tsx.
export default function sitemap(): MetadataRoute.Sitemap {
    return [];
}
