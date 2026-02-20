import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    // In a real app, you would fetch the product details from the backend here
    return {
        title: `Premium Product ${params.id} | NexCart`,
        description: `Discover the best features of our premium product ${params.id}. Fast shipping and secure payments on NexCart.`,
        openGraph: {
            type: 'website',
            url: `https://nexcart.com/products/${params.id}`,
            title: `Premium Product ${params.id} | NexCart`,
            description: `Discover the best features of our premium product ${params.id}.`,
            images: [
                {
                    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop', // fallback dynamic image
                    width: 800,
                    height: 600,
                    alt: 'Product Image',
                },
            ],
        }
    };
}

export default function ProductLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
    // JSON-LD Schema for rich Google search results parsing
    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": `Premium Product ${params.id}`,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "description": `Discover our premium product ${params.id} specifically built for professionals.`,
        "sku": params.id,
        "offers": {
            "@type": "Offer",
            "url": `https://nexcart.com/products/${params.id}`,
            "priceCurrency": "USD",
            "price": "199.99",
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "NexCart Inc."
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
