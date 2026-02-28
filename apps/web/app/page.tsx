"use client";

import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
// Applied via Tailwind + inline where needed. Tokens:
//   --clr-ink:   #0a0a0a    (near-black)
//   --clr-paper: #f5f3ef    (warm off-white)
//   --clr-accent:#c8ff00    (electric lime – performance pop)
//   --clr-mid:   #888       (muted)

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const [storeMode, setStoreMode] = useState<{ mode: string; productId: string | null }>({
    mode: "multi",
    productId: null,
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      image: "https://cdn.prod.website-files.com/67bc58183fe9a751de6f5611/67f1cedcf33de00b028e41d9_revery-casestudy-nike-speed-revealed-hero.png",
      label: "SS 2025",
      headline: "Zero Limits",
      sub: "New season. New speed.",
    },
    {
      image: "https://media.endclothing.com/end-features/f_auto,q_auto:eco,w_1520/prodfeatures/Z-5owndAxsiBwRJa_18-03-25_NIKEAIRZOOMSPIRIDONSP_hf9117-400__Email_1200x78.jpg?auto=format,compress",
      label: "Air Collection",
      headline: "Float Forward",
      sub: "The future of cushioning.",
    },
    {
      image: "https://static.nike.com/a/images/w_1920,c_limit/fafd7d08-2216-431b-bc56-f81b1cf7056c/the-best-chunky-sneaker-styles-by-nike.jpg",
      label: "Statement Silhouettes",
      headline: "Bold. Loud. Yours.",
      sub: "Chunky done right.",
    },
    {
      image: "https://cdn.dribbble.com/userupload/6110032/file/original-a2f2a8b0b923a9abdc7b38fcfff6a160.png?resize=1600x0",
      label: "Design Study",
      headline: "Form Is Function",
      sub: "Where art meets the street.",
    },
  ];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length, prefersReducedMotion]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    if (storeMode.mode === "single" && storeMode.productId) {
      router.push(`/products/${storeMode.productId}`);
    }
  }, [storeMode, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRes = await api.get("/settings").catch(() => ({ data: null }));
        const settings = settingsRes.data;
        if (settings?.storeMode === "single" && settings?.singleProductId) {
          setStoreMode({ mode: "single", productId: settings.singleProductId });
        }
      } catch (err) {
        console.error("Homepage settings fetch failed:", err);
      }
    };
    fetchSettings();
  }, []);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["home-products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: {
        products?: { id: string; title: string; description: string; price: number; gallery?: string[] }[];
      } = await res.json();
      return (
        data.products?.slice(0, 8).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          image: p.gallery?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
        })) ?? []
      );
    },
  });

  const slide = heroSlides[currentSlide];

  return (
    <>
      {/* ── Global style tokens ─────────────────────────────────── */}
      <style>{`
        :root {
          --ink: #0a0a0a;
          --paper: #f5f3ef;
          --accent: #c8ff00;
          --mid: #8a8a8a;
          --border: rgba(10,10,10,0.12);
        }
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        .font-display { font-family: 'Barlow Condensed', sans-serif; }
        .font-body   { font-family: 'DM Sans', sans-serif; }

        /* Slide crossfade */
        .hero-slide { position:absolute;inset:0;transition:opacity 1.2s cubic-bezier(.4,0,.2,1); }
        .hero-slide.active { opacity:1; }
        .hero-slide.inactive { opacity:0; }

        /* Pill tag */
        .tag {
          display:inline-flex;align-items:center;gap:6px;
          font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;
          text-transform:uppercase;padding:5px 14px;border-radius:999px;
          border:1px solid var(--border);color:var(--mid);background:transparent;
        }
        .tag-inv {
          background:var(--accent);border-color:var(--accent);color:var(--ink);
        }

        /* Slide dot */
        .dot { width:28px;height:3px;border-radius:2px;background:rgba(255,255,255,.35);transition:all .4s; cursor:pointer;}
        .dot.active { background:#fff;width:52px;}

        /* Category card hover */
        .cat-card { position:relative;overflow:hidden;cursor:pointer; }
        .cat-card img { transition:transform .7s cubic-bezier(.4,0,.2,1); }
        .cat-card:hover img { transform:scale(1.06); }
        .cat-card .cat-overlay { position:absolute;inset:0;background:linear-gradient(to top, rgba(10,10,10,.7) 0%, transparent 55%);transition:opacity .4s; }
        .cat-card:hover .cat-overlay { opacity:.85; }

        /* Product grid hover */
        .product-lift { transition:transform .35s cubic-bezier(.4,0,.2,1); }
        .product-lift:hover { transform:translateY(-6px); }

        /* Section divider */
        .divider { height:1px;background:var(--border);margin:0; }

        /* Marquee */
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-inner { display:flex;gap:0;animation:marquee 22s linear infinite; }
        .marquee-inner:hover { animation-play-state:paused; }

        /* Btn reset */
        .btn-primary {
          display:inline-flex;align-items:center;gap:10px;
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;
          padding:14px 32px;border-radius:4px;
          background:var(--ink);color:#fff;border:none;cursor:pointer;
          transition:background .25s,transform .2s;
        }
        .btn-primary:hover { background:#222;transform:translateY(-1px); }
        .btn-outline {
          display:inline-flex;align-items:center;gap:10px;
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;
          padding:13px 32px;border-radius:4px;
          background:transparent;color:var(--ink);border:1.5px solid var(--ink);cursor:pointer;
          transition:background .25s,color .25s,transform .2s;
        }
        .btn-outline:hover { background:var(--ink);color:#fff;transform:translateY(-1px); }
        .btn-accent {
          display:inline-flex;align-items:center;gap:10px;
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;
          padding:14px 32px;border-radius:4px;
          background:var(--accent);color:var(--ink);border:none;cursor:pointer;
          transition:opacity .25s,transform .2s;
        }
        .btn-accent:hover { opacity:.88;transform:translateY(-1px); }
      `}</style>

      <div className="font-body" style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative w-full overflow-hidden"
          style={{ height: "100svh", minHeight: 600, maxHeight: 960 }}
        >
          {/* Slides */}
          {heroSlides.map((s, i) => (
            <div
              key={i}
              className={`hero-slide ${i === currentSlide ? "active" : "inactive"}`}
            >
              <motion.img
                src={s.image}
                alt={s.headline}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ y: heroY }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,10,.72) 0%, rgba(10,10,10,.1) 60%, transparent 100%)" }} />
            </div>
          ))}

          {/* Hero content */}
          <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-8 md:px-16 lg:px-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: .7, ease: [.16, 1, .3, 1] }}
                className="max-w-2xl"
              >
                <span className="tag" style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)", marginBottom: 20, display: "inline-block" }}>
                  {slide.label}
                </span>
                <h1 className="font-display text-white uppercase leading-none mb-4"
                  style={{ fontSize: "clamp(64px, 10vw, 128px)", fontWeight: 900, letterSpacing: "-.01em" }}>
                  {slide.headline}
                </h1>
                <p className="text-white/70 mb-10" style={{ fontSize: 18, fontWeight: 300, maxWidth: 400 }}>
                  {slide.sub}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/products">
                    <button className="btn-accent">
                      Shop Now <ArrowRight size={15} />
                    </button>
                  </Link>
                  <Link href="/categories">
                    <button className="btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>
                      Explore
                    </button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide controls */}
            <div className="flex items-center gap-6 mt-12">
              <button onClick={prevSlide} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {heroSlides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`dot ${i === currentSlide ? "active" : ""}`} />
                ))}
              </div>
              <button onClick={nextSlide} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <ChevronRight size={18} />
              </button>
              <span className="ml-auto text-white/40 font-display text-sm tracking-widest uppercase">
                {String(currentSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </section>

        {/* ── MARQUEE STRIP ────────────────────────────────────────── */}
        <div className="overflow-hidden py-4" style={{ background: "var(--accent)" }}>
          <div className="marquee-inner">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="font-display text-sm uppercase tracking-widest whitespace-nowrap px-10"
                style={{ color: "var(--ink)", fontWeight: 700, letterSpacing: ".2em" }}>
                New Arrivals &nbsp;·&nbsp; Free Shipping Over $50 &nbsp;·&nbsp; Easy Returns &nbsp;·&nbsp; Members Get Early Access &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
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
            {/* Large feature card */}
            <Link href="/categories/running" className="col-span-12 md:col-span-7 cat-card rounded-2xl relative" style={{ height: 480 }}>
              <Image src="https://static.nike.com/a/images/w_1920,c_limit/fafd7d08-2216-431b-bc56-f81b1cf7056c/the-best-chunky-sneaker-styles-by-nike.jpg"
                alt="Running" fill className="object-cover" style={{ borderRadius: "inherit" }} />
              <div className="cat-overlay rounded-2xl" />
              <div className="absolute bottom-0 left-0 p-8 z-10">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">Category</p>
                <h3 className="font-display text-white uppercase text-4xl font-black leading-none">Running</h3>
              </div>
            </Link>

            {/* Small stacked */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4 lg:gap-6">
              <Link href="/categories/lifestyle" className="cat-card rounded-2xl flex-1 relative" style={{ minHeight: 224 }}>
                <Image src="https://media.endclothing.com/end-features/f_auto,q_auto:eco,w_1520/prodfeatures/Z-5owndAxsiBwRJa_18-03-25_NIKEAIRZOOMSPIRIDONSP_hf9117-400__Email_1200x78.jpg?auto=format,compress"
                  alt="Lifestyle" fill className="object-cover" style={{ borderRadius: "inherit" }} />
                <div className="cat-overlay rounded-2xl" />
                <div className="absolute bottom-0 left-0 p-6 z-10">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">Category</p>
                  <h3 className="font-display text-white uppercase text-3xl font-black leading-none">Lifestyle</h3>
                </div>
              </Link>
              <Link href="/categories/training" className="cat-card rounded-2xl flex-1 relative" style={{ minHeight: 224 }}>
                <Image src="https://cdn.dribbble.com/userupload/6110032/file/original-a2f2a8b0b923a9abdc7b38fcfff6a160.png?resize=1600x0"
                  alt="Training" fill className="object-cover" style={{ borderRadius: "inherit" }} />
                <div className="cat-overlay rounded-2xl" />
                <div className="absolute bottom-0 left-0 p-6 z-10">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">Category</p>
                  <h3 className="font-display text-white uppercase text-3xl font-black leading-none">Training</h3>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <div className="divider mx-6 md:mx-12 lg:mx-20" />

        {/* ── TRENDING PRODUCTS ─────────────────────────────────────── */}
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
              ? products.map((product: Product, i: number) => (
                <motion.div
                  key={product.id}
                  className="product-lift"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: .65, delay: i * 0.07 }}
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
              <button className="btn-outline">
                Browse All Products <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </section>

        {/* ── FULL-BLEED EDITORIAL BANNER ────────────────────────── */}
        <section className="relative overflow-hidden" style={{ height: "clamp(380px, 55vw, 620px)" }}>
          <Image
            src="https://cdn.prod.website-files.com/67bc58183fe9a751de6f5611/67f1cedcf33de00b028e41d9_revery-casestudy-nike-speed-revealed-hero.png"
            alt="Editorial"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,.8) 0%, rgba(10,10,10,.1) 70%)" }} />
          <div className="relative z-10 h-full flex items-center px-8 md:px-16 lg:px-24">
            <div style={{ maxWidth: 560 }}>
              <span className="tag" style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)", marginBottom: 20, display: "inline-block" }}>
                Editor&apos;s Pick
              </span>
              <h2 className="font-display text-white uppercase mb-5"
                style={{ fontSize: "clamp(44px, 6vw, 80px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.01em" }}>
                Built for the Long Run
              </h2>
              <p className="text-white/60 mb-10" style={{ fontSize: 16, fontWeight: 300, maxWidth: 380 }}>
                Our most technical shoe yet. Engineered for distance, refined for the streets.
              </p>
              <Link href="/products">
                <button className="btn-accent">
                  Discover the Collection <ArrowRight size={15} />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── VALUE PROPS ───────────────────────────────────────────── */}
        <section style={{ background: "var(--ink)", color: "#fff" }}>
          <div className="px-6 md:px-12 lg:px-20 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "rgba(255,255,255,.1)" }}>
              {[
                { stat: "Free", label: "Shipping", desc: "On every order over $50" },
                { stat: "30-Day", label: "Returns", desc: "No questions asked" },
                { stat: "100%", label: "Secure", desc: "End-to-end encrypted checkout" },
              ].map((item, i) => (
                <div key={i} className="py-10 px-8 md:px-12">
                  <p className="font-display text-5xl font-black uppercase mb-1"
                    style={{ color: "var(--accent)", lineHeight: 1 }}>
                    {item.stat}
                  </p>
                  <p className="font-display text-2xl font-bold uppercase mb-2" style={{ letterSpacing: ".02em" }}>
                    {item.label}
                  </p>
                  <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, fontWeight: 300 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── JOIN CTA ─────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-24 lg:py-36" style={{ background: "var(--paper)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <span className="tag tag-inv mb-6" style={{ display: "inline-block" }}>Membership</span>
            <h2 className="font-display uppercase mb-6"
              style={{ fontSize: "clamp(44px, 8vw, 88px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.02em" }}>
              Join the Movement
            </h2>
            <p style={{ color: "var(--mid)", fontSize: 18, fontWeight: 300, maxWidth: 480, margin: "0 auto 48px" }}>
              Early access to drops. Exclusive perks. A community that moves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="btn-primary" style={{ fontSize: 14 }}>
                  Create Account – It&apos;s Free <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/products">
                <button className="btn-outline" style={{ fontSize: 14 }}>
                  Shop as Guest
                </button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}