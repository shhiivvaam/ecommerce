"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductSummary } from "@repo/types";
import { FALLBACK_IMAGE } from "@/constants/home";

async function fetchProducts(): Promise<ProductSummary[]> {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");
    const data: { products?: { id: string; title: string; description: string; price: number; gallery?: string[] }[] } =
        await res.json();
    return (
        data.products?.slice(0, 8).map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            image: p.gallery?.[0] ?? FALLBACK_IMAGE,
            gallery: p.gallery ?? [],
        })) ?? []
    );
}

export function ProductGrid() {
    const { data: products = [], isLoading } = useQuery<ProductSummary[]>({
        queryKey: ["home-products"],
        queryFn: fetchProducts,
    });

    return (
        <section className="px-6 md:px-12 lg:px-20 py-20 lg:py-28" style={{ background: "var(--paper)" }}>
            <div className="flex items-end justify-between mb-12">
                <div>
                    <span className="tag tag-inv mb-3" style={{ display: "inline-block" }}>Just Dropped</span>
                    <h2 className="font-display uppercase" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.01em" }}>
                        Trending Now
                    </h2>
                </div>
                <Link href="/products" className="hidden md:flex items-center gap-2 text-sm uppercase tracking-widest font-medium hover:opacity-60 transition-opacity" style={{ color: "var(--mid)" }}>
                    View All <ArrowUpRight size={14} />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
                {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: "3/4", background: "rgba(10,10,10,.07)" }} />
                    ))
                    : products.length > 0
                        ? products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                className="product-lift"
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.65, delay: i * 0.07 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))
                        : (
                            <div className="col-span-full py-20 text-center" style={{ color: "var(--mid)" }}>
                                No products available yet.
                            </div>
                        )}
            </div>

            <div className="mt-14 flex justify-center">
                <Link href="/products">
                    <button className="btn-outline">Browse All Products <ArrowRight size={15} /></button>
                </Link>
            </div>
        </section>
    );
}
