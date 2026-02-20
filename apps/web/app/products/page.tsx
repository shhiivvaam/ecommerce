"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";

const SAMPLE_PRODUCTS = [
    { id: "1", title: "Premium Wireless Headphones", description: "Immersive noise-cancelling audio experience tailored for audiophiles.", price: 299.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop", category: "audio" },
    { id: "2", title: "Minimalist Smartwatch", description: "Track your fitness and stay connected with this sleek design.", price: 199.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop", category: "wearable" },
    { id: "3", title: "Ergonomic Mechanical Keyboard", description: "Tactile switches with customizable RGB lighting for creators.", price: 149.99, image: "https://images.unsplash.com/photo-1511467687858-23d9a1a2e316?q=80&w=1000&auto=format&fit=crop", category: "accessories" },
    { id: "4", title: "Polaroid Instant Camera", description: "Capture the moment instantly with vintage polaroid film.", price: 129.99, image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1000&auto=format&fit=crop", category: "photography" },
    { id: "5", title: "Wireless Charging Pad", description: "Fast-charging Qi pad compatible with modern smartphones.", price: 49.99, image: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?q=80&w=1000&auto=format&fit=crop", category: "accessories" },
    { id: "6", title: "Noise-isolating Earbuds", description: "Compact buds delivering powerful bass and clear highs.", price: 89.99, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop", category: "audio" },
];

export default function ProductsPage() {
    const [filter, setFilter] = useState("all");

    const filteredProducts = filter === "all"
        ? SAMPLE_PRODUCTS
        : SAMPLE_PRODUCTS.filter(p => p.category === filter);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight mb-4">All Products</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Explore our extensive collection of premium lifestyle gear curated just for you.
                </p>
            </div>

            <div className="flex justify-center gap-2 mb-12 flex-wrap">
                {["all", "audio", "wearable", "accessories", "photography"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
