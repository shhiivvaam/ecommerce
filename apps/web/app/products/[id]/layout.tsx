import { Metadata } from 'next';
import { api } from '@/lib/api';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number;
    gallery: string[];
    category?: { name: string };
}

async function getProduct(id: string): Promise<Product | null> {
    try {
        const { data } = await api.get(`/products/${id}`);
        return data;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return {
            title: 'Product not found | NexCart',
            description: 'The requested product could not be located.'
        };
    }

    const title = `${product.title} | NexCart`;
    const description = product.description.slice(0, 160);
    const image = product.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";

    return {
        title,
        description,
        openGraph: {
            type: 'website',
            url: `https://nexus-os.com/products/${id}`,
            title,
            description,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: product.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) return <>{children}</>;

    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": product.gallery,
        "description": product.description,
        "sku": product.id,
        "category": product.category?.name,
        "offers": {
            "@type": "Offer",
            "url": `https://nexcart.com/products/${id}`,
            "priceCurrency": "USD",
            "price": product.discounted ?? product.price,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </section>
    );
}
