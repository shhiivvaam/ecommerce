import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://reyva.co.in';

    // In a real app, you'd fetch dynamic routes here (products, categories)
    // For now, we'll implement the static ones and a pattern for dynamic ones.

    const staticRoutes = [
        '',
        '/products',
        '/gift-cards',
        '/search',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return [
        ...staticRoutes,
    ];
}
