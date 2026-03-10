'use client';

import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Product {
    id: string;
    title: string;
    price: number;
    slug: string;
    gallery?: string[];
}

export default function RecentlyViewed() {
    const { recentProductIds } = useRecentlyViewed();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            if (!recentProductIds || recentProductIds.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Ideally, the backend would have a bulk fetch by ID. 
                // For now, we'll fire off concurrent promises to fetch minimal details.
                const promises = recentProductIds.map(id => api.get(`/products/${id}`));
                const results = await Promise.allSettled(promises);

                const fetchedProducts = results
                    .filter((res) => res.status === 'fulfilled')
                    .map((res) => (res as PromiseFulfilledResult<{ data: Product }>).value?.data);

                setProducts(fetchedProducts);
            } catch (err) {
                console.error('Failed to fetch recently viewed products', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [recentProductIds]);

    if (loading) {
        return <div className="animate-pulse flex space-x-4 p-4">Loading recently viewed...</div>;
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="mt-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 font-outfit">
                Recently Viewed
            </h2>
            <div className="grid grid-cols-2 mt-6 gap-y-10 gap-x-6 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                    <div key={product.id} className="group relative">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 lg:aspect-none lg:h-80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={product.gallery?.[0] || 'https://via.placeholder.com/400'}
                                alt={product.title}
                                className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                            />
                        </div>
                        <div className="mt-4 flex justify-between">
                            <div>
                                <h3 className="text-sm text-gray-700 font-inter">
                                    <Link href={`/products/${product.slug}`}>
                                        <span aria-hidden="true" className="absolute inset-0" />
                                        {product.title}
                                    </Link>
                                </h3>
                            </div>
                            <p className="text-sm font-medium text-gray-900">${product.price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
