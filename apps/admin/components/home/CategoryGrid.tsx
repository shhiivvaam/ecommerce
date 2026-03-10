"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_CARDS } from "@/constants/home";

export function CategoryGrid() {
    const [large, ...small] = CATEGORY_CARDS;

    return (
        <section className="px-6 md:px-12 lg:px-20 py-20 lg:py-28" style={{ background: "var(--paper)" }}>
            <div className="flex items-end justify-between mb-12">
                <div>
                    <span className="tag tag-inv mb-3" style={{ display: "inline-block" }}>Collections</span>
                    <h2 className="font-display uppercase" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.01em" }}>
                        Shop by Category
                    </h2>
                </div>
                <Link href="/categories" className="hidden md:flex items-center gap-2 text-sm uppercase tracking-widest font-medium hover:opacity-60 transition-opacity" style={{ color: "var(--mid)" }}>
                    All <ArrowUpRight size={14} />
                </Link>
            </div>

            <div className="grid grid-cols-12 gap-4 lg:gap-6">
                {/* Large card */}
                <Link href={`/categories/${large.slug}`} className="col-span-12 md:col-span-7 cat-card rounded-2xl relative" style={{ height: 480 }}>
                    <Image src={large.image} alt={large.name} fill className="object-cover" style={{ borderRadius: "inherit" }} />
                    <div className="cat-overlay rounded-2xl" />
                    <div className="absolute bottom-0 left-0 p-8 z-10">
                        <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">Category</p>
                        <h3 className="font-display text-white uppercase text-4xl font-black leading-none">{large.name}</h3>
                    </div>
                </Link>

                {/* Small stacked */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-4 lg:gap-6">
                    {small.map((cat) => (
                        <Link key={cat.slug} href={`/categories/${cat.slug}`} className="cat-card rounded-2xl flex-1 relative" style={{ minHeight: 224 }}>
                            <Image src={cat.image} alt={cat.name} fill className="object-cover" style={{ borderRadius: "inherit" }} />
                            <div className="cat-overlay rounded-2xl" />
                            <div className="absolute bottom-0 left-0 p-6 z-10">
                                <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">Category</p>
                                <h3 className="font-display text-white uppercase text-3xl font-black leading-none">{cat.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
