"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EDITORIAL_BANNER } from "@/constants/home";

export function EditorialBanner() {
    return (
        <section className="relative overflow-hidden" style={{ height: "clamp(380px, 55vw, 620px)" }}>
            <Image
                src={EDITORIAL_BANNER.image}
                alt="Editorial"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,.8) 0%, rgba(10,10,10,.1) 70%)" }} />
            <div className="relative z-10 h-full flex items-center px-8 md:px-16 lg:px-24">
                <div style={{ maxWidth: 560 }}>
                    <span className="tag" style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)", marginBottom: 20, display: "inline-block" }}>
                        {EDITORIAL_BANNER.tag}
                    </span>
                    <h2
                        className="font-display text-white uppercase mb-5"
                        style={{ fontSize: "clamp(44px, 6vw, 80px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.01em" }}
                    >
                        {EDITORIAL_BANNER.headline}
                    </h2>
                    <p className="text-white/60 mb-10" style={{ fontSize: 16, fontWeight: 300, maxWidth: 380 }}>
                        {EDITORIAL_BANNER.body}
                    </p>
                    <Link href="/products">
                        <button className="btn-accent">Discover the Collection <ArrowRight size={15} /></button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
