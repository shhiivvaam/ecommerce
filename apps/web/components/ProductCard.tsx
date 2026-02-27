"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { analytics } from "@/lib/analytics";

interface ProductCardProps {
    product: {
        id: string;
        title: string;
        description: string;
        price: number;
        discounted?: number | null;
        image: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);
    const { isAuthenticated } = useAuthStore();
    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const displayPrice = product.discounted ?? product.price;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            productId: product.id,
            title: product.title,
            price: displayPrice,
            quantity: 1,
            image: product.image,
        });
        analytics.track('ADD_TO_CART', {
            productId: product.id,
            title: product.title,
            price: displayPrice,
            location: 'gallery_card'
        });

        toast.success("Added to collection", {
            icon: '🛍️',
            style: { borderRadius: '16px', fontWeight: 'bold' }
        });
    };

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error("Auth required for curation");
            return;
        }
        setWishlistLoading(true);
        try {
            if (wishlisted) {
                await api.delete(`/wishlist/${product.id}`);
                setWishlisted(false);
            } else {
                await api.post(`/wishlist/${product.id}`);
                setWishlisted(true);
                toast.success("Saved to your curation", {
                    icon: '🖤',
                    style: { borderRadius: '16px', fontWeight: 'bold' }
                });
            }
        } catch {
            toast.error("Synchronization failure");
        } finally {
            setWishlistLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col bg-white rounded-[32px] border-2 border-slate-100 overflow-hidden hover:border-black/5 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500"
        >
            <Link href={`/products/${product.id}`} className="flex-1 flex flex-col">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50">
                    {/* Media Layer */}
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    {/* Overlay Action Layer */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <button
                            onClick={handleToggleWishlist}
                            disabled={wishlistLoading}
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all shadow-xl backdrop-blur-md ${wishlisted
                                ? "bg-rose-500 text-white scale-110"
                                : "bg-white/90 text-slate-400 hover:text-rose-500 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                }`}
                        >
                            <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
                        </button>
                    </div>

                    {product.discounted && (
                        <div className="absolute top-4 left-4 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg">
                            Archive Sale
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 translate-y-20 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <Button
                            className="w-full h-12 rounded-[20px] font-black uppercase tracking-widest text-[10px] gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleAddToCart}
                        >
                            <Plus className="h-3 w-3" /> Quick Add
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-black tracking-tight leading-tight line-clamp-2 uppercase">
                            {product.title}
                        </h3>
                        <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all duration-500 shrink-0">
                            <ArrowUpRight className="h-3 w-3" />
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed italic">
                        {product.description}
                    </p>

                    <div className="pt-4 mt-auto flex items-baseline gap-2">
                        <span className="text-xl font-black tracking-tighter text-black tabular-nums">
                            ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {product.discounted && (
                            <span className="text-xs text-slate-300 font-bold line-through tabular-nums">
                                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
