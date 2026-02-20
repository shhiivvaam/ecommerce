"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Using the same mock for frontend demo before connecting to backend
const SAMPLE_PRODUCTS = [
    { id: "1", title: "Premium Wireless Headphones", description: "Immersive noise-cancelling audio experience tailored for audiophiles.", price: 299.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop", category: "audio" },
    { id: "2", title: "Minimalist Smartwatch", description: "Track your fitness and stay connected with this sleek design.", price: 199.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop", category: "wearable" },
];

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const product = SAMPLE_PRODUCTS.find(p => p.id === params.id) || SAMPLE_PRODUCTS[0]; // fallback for demo
    const addItem = useCartStore(state => state.addItem);
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity,
            image: product.image
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                    <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
                </div>

                <div className="flex flex-col justify-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{product.title}</h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                        <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} fill="currentColor" className="w-4 h-4" />)}
                            <span className="text-muted-foreground text-sm ml-2">(124 reviews)</span>
                        </div>
                    </div>

                    <p className="mt-6 text-base text-muted-foreground leading-relaxed">{product.description}</p>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex items-center border rounded-md h-12">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-lg hover:bg-muted transition-colors rounded-l-md">-</button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="px-4 text-lg hover:bg-muted transition-colors rounded-r-md">+</button>
                        </div>
                        <Button size="lg" className="h-12 flex-1 rounded-full shadow-lg" onClick={handleAddToCart}>
                            <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                        </Button>
                    </div>

                    <div className="mt-12 space-y-4 border-t pt-8">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Truck className="h-5 w-5 text-primary" /> Free shipping on orders over $100
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <ShieldCheck className="h-5 w-5 text-primary" /> 1-year extended warranty included
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
