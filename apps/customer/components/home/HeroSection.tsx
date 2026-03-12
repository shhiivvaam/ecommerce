"use client";

import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HERO_SLIDES } from "@/constants/home";
import type { Banner } from "@repo/types";

export function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const heroRef = useRef<HTMLElement>(null);

    // use HERO_SLIDES as a fallback, replace when remote banners load
    const [slides, setSlides] = useState(() =>
        HERO_SLIDES.map((s: { label: string; headline: string; sub: string; image: string; link?: string }) => ({
            label: s.label,
            headline: s.headline,
            sub: s.sub,
            image: s.image,
            link: s.link ?? "/products",
        }))
    );

    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

    useEffect(() => {
        if (prefersReducedMotion) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [prefersReducedMotion, slides.length]);

    // Fetch banners from local API route and map to slide shape
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                const res = await fetch("/api/banners", {
                    headers: { Accept: "application/json" },
                    signal: ac.signal,
                });
                if (!res.ok) return;
                const data = (await res.json()) as Banner[];
                const mapped = data
                    .filter((b) => b.active)
                    .map((b) => ({
                        label: b.subtitle ?? "",
                        // keep original HTML (<br/>) from title and render with dangerouslySetInnerHTML
                        headline: b.title ?? "",
                        sub: b.subtitle ?? "",
                        image: b.imageUrl ?? "",
                        link: (b as { link?: string; linkUrl?: string }).link ?? (b as { link?: string; linkUrl?: string }).linkUrl ?? "/products",
                    }));
                if (mapped.length) {
                    setSlides(mapped);
                    setCurrentSlide(0);
                }
            } catch {
                /* ignore fetch errors and keep fallback slides */
            }
        })();
        return () => ac.abort();
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const slide = slides[currentSlide];

    return (
        <section
            ref={heroRef}
            className="relative w-full overflow-hidden"
            style={{ height: "100svh", minHeight: 600, maxHeight: 960 }}
        >
            {/* Slides */}
            {slides.map((s, i) => (
                <div key={s.headline + i} className={`hero-slide ${i === currentSlide ? "active" : "inactive"}`}>
                    <motion.img
                        src={s.image}
                        alt={typeof s.headline === "string" ? s.headline.replace(/<[^>]+>/g, "") : "hero"}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ y: heroY }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,10,.72) 0%, rgba(10,10,10,.1) 60%, transparent 100%)" }} />
                </div>
            ))}

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-8 md:px-16 lg:px-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl"
                    >
                        <span className="tag" style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)", marginBottom: 20, display: "inline-block" }}>
                            {slide.label}
                        </span>
                        <h1
                            className="font-display text-white uppercase leading-none mb-4"
                            style={{ fontSize: "clamp(64px, 10vw, 128px)", fontWeight: 900, letterSpacing: "-.01em" }}
                            // title may contain <br/> tags from API
                            dangerouslySetInnerHTML={{ __html: slide.headline }}
                        />
                        <p className="text-white/70 mb-10" style={{ fontSize: 18, fontWeight: 300, maxWidth: 400 }}>
                            {slide.sub}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={slide.link ?? "/products"}>
                                <button className="btn-accent">Shop Now <ArrowRight size={15} /></button>
                            </Link>
                            <Link href="/categories">
                                <button className="btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>Explore</button>
                            </Link>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-12">
                    <button onClick={prevSlide} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-2">
                        {slides.map((s, i) => (
                            <button key={s.headline + i} onClick={() => setCurrentSlide(i)} className={`dot ${i === currentSlide ? "active" : ""}`} />
                        ))}
                    </div>
                    <button onClick={nextSlide} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ChevronRight size={18} />
                    </button>
                    <span className="ml-auto text-white/40 font-display text-sm tracking-widest uppercase">
                        {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>
                </div>
            </div>
        </section>
    );
}
