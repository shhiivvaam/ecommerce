"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@repo/ui";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";

interface WishlistItem {
    id: string;
    productId: string;
    product: {
        id: string;
        title: string;
        price: number;
        discounted?: number;
        gallery: string[];
        stock: number;
        category?: { name: string };
    };
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore(state => state.addItem);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setItems(data);
        } catch (err) {
            console.error("Failed to load wishlist", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWishlist(); }, []);

    const handleRemove = async (productId: string) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            setItems(prev => prev.filter(i => i.productId !== productId));
            toast.success("Removed from wishlist");
        } catch {
            toast.error("Failed to remove item");
        }
    };

    const handleMoveToCart = async (item: WishlistItem) => {
        const price = item.product.discounted ?? item.product.price;
        const image = item.product.gallery?.[0];
        await addItem({ productId: item.product.id, title: item.product.title, price, quantity: 1, image });
        await handleRemove(item.productId);
        toast.success("Moved to cart!");
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card/50">
                <Heart className="h-16 w-16 text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-2xl font-semibold tracking-tight mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    Save items you love here. They&apos;ll be waiting for you whenever you&apos;re ready.
                </p>
                <Link href="/products">
                    <Button>Browse Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
                <p className="text-muted-foreground mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => {
                    const price = item.product.discounted ?? item.product.price;
                    const originalPrice = item.product.discounted ? item.product.price : undefined;
                    const image = item.product.gallery?.[0] ?? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop";
                    const outOfStock = item.product.stock === 0;

                    return (
                        <div key={item.id} className="border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <Link href={`/products/${item.product.id}`}>
                                <div className="relative h-48 bg-muted">
                                    <Image src={image} alt={item.product.title} fill unoptimized className="object-cover" />
                                    {outOfStock && (
                                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-muted-foreground">Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="p-4">
                                {item.product.category && (
                                    <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">{item.product.category.name}</p>
                                )}
                                <Link href={`/products/${item.product.id}`}>
                                    <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">{item.product.title}</h3>
                                </Link>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="font-bold text-lg">${price.toFixed(2)}</span>
                                    {originalPrice && (
                                        <span className="text-sm text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleMoveToCart(item)}
                                        disabled={outOfStock}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                                        {outOfStock ? "Out of Stock" : "Move to Cart"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemove(item.productId)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
