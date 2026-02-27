"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowUpRight, Plus } from "lucide-react";
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
            className="group relative flex flex-col bg-white dark:bg-[#0a0a0a] rounded-[40px] border-2 border-slate-50 dark:border-slate-800 hover:border-black/5 dark:hover:border-white/10 overflow-hidden hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-none transition-all duration-500"
        >
            <Link href={`/products/${product.id}`} className="flex-1 flex flex-col">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
                    {/* Media Layer */}
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    {/* Overlay Action Layer */}
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                        <button
                            onClick={handleToggleWishlist}
                            disabled={wishlistLoading}
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-xl backdrop-blur-md border-2 ${wishlisted
                                ? "bg-rose-500 border-rose-400 text-white scale-110"
                                : "bg-white/90 dark:bg-black/90 border-white/20 dark:border-white/10 text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 translate-x-16 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-2xl"
                                }`}
                        >
                            <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-white" : ""}`} />
                        </button>
                    </div>

                    {product.discounted && (
                        <div className="absolute top-6 left-6 bg-primary text-white text-[9px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-2xl border border-white/20">
                            Archive Sale
                        </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 translate-y-24 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                        <Button
                            className="w-full h-14 rounded-[24px] font-black uppercase tracking-widest text-[10px] gap-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] active:scale-95 bg-white dark:bg-white text-black hover:bg-slate-100"
                            onClick={handleAddToCart}
                        >
                            <Plus className="h-4 w-4" /> Quick Add
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-4 flex-1 flex flex-col transition-colors">
                    <div className="flex justify-between items-start gap-6">
                        <h3 className="text-lg font-black tracking-tighter leading-none group-hover:text-primary transition-colors uppercase text-black dark:text-white">
                            {product.title}
                        </h3>
                        <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500 shrink-0 border border-slate-100 dark:border-slate-800">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-600 font-medium line-clamp-2 leading-relaxed italic border-l-2 border-slate-50 dark:border-slate-900 pl-4">
                        {product.description}
                    </p>

                    <div className="pt-4 mt-auto flex items-baseline gap-3">
                        <span className="text-2xl font-black tracking-tighter text-black dark:text-white tabular-nums">
                            ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {product.discounted && (
                            <span className="text-[10px] text-slate-300 dark:text-slate-800 font-bold line-through tabular-nums uppercase tracking-widest">
                                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
