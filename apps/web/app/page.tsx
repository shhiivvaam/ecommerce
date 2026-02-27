"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Truck, Award, TrendingUp, ChevronRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [storeMode, setStoreMode] = useState<{ mode: string; productId: string | null }>({ mode: 'multi', productId: null });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeMode.mode === 'single' && storeMode.productId) {
      router.push(`/products/${storeMode.productId}`);
    }
  }, [storeMode, router]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          api.get('/settings').catch(() => ({ data: null })),
          api.get('/products?limit=8').catch(() => ({ data: { products: [] } })),
        ]);

        const settings = settingsRes.data;
        if (settings?.storeMode === 'single' && settings?.singleProductId) {
          setStoreMode({ mode: 'single', productId: settings.singleProductId });
        }

        const formattedProducts = productsRes.data.products?.map((p: { id: string; title: string; description: string; price: number; gallery?: string[] }) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          image: p.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
        })) || [];

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Critical: Homepage intelligence failure", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  
  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-500 overflow-x-hidden">
      {/* Hero – 3D Shopping Bag */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 pt-32 pb-24 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Copy */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -32 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Fresh picks, delivered fast
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
              Everything you love,{" "}
              <span className="text-primary">in one cart.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              Discover curated products from brands you trust, with smooth checkout,
              secure payments, and delivery that just works.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/products">
                <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 text-sm font-semibold">
                  Shop now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 md:h-14 px-8 md:px-10 text-sm font-medium"
                >
                  Browse categories
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Buyer protection
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Fast, trackable delivery
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Trusted brands
              </div>
            </div>
          </motion.div>

          {/* 3D-style animated bag */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 32 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="lg:col-span-6 flex justify-center lg:justify-end"
          >
            <div className="relative h-[260px] w-[260px] md:h-[320px] md:w-[320px]">
              {/* Back glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />

              {/* Floating orbits */}
              {!prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute -top-4 -right-6 h-20 w-20 rounded-full bg-primary/20 blur-xl"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-primary/10 blur-xl"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  />
                </>
              )}

              {/* Bag base */}
              <motion.div
                className="relative z-10 h-full w-full rounded-[2.2rem] bg-card shadow-[0_28px_60px_-22px_rgba(15,23,42,0.55)] border border-border flex items-center justify-center"
                animate={
                  prefersReducedMotion
                    ? {}
                    : { y: [-4, 4, -4], rotate: [-1.5, 1.5, -1.5] }
                }
                transition={{
                  repeat: Infinity,
                  duration: 7,
                  ease: "easeInOut",
                }}
              >
                <div className="relative h-[72%] w-[72%] rounded-[1.8rem] bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900/80 border border-white/50 dark:border-white/5 shadow-inner">
                  {/* Handles */}
                  <div className="absolute -top-6 left-7 right-7 flex justify-between">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                      <div className="h-5 w-5 rounded-full border border-primary/50" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                      <div className="h-5 w-5 rounded-full border border-primary/50" />
                    </div>
                  </div>
                  <div className="absolute -top-2 left-10 right-10 h-6 rounded-full border border-primary/50/60 dark:border-primary/50/40" />

                  {/* Contents */}
                  <div className="absolute inset-x-5 top-10 bottom-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
                        <ShoppingBag className="h-4 w-4" />
                        Today’s picks
                      </span>
                      <span className="text-xs text-muted-foreground">+3 items</span>
                    </div>
                    <div className="space-y-2 text-left">
                      <p className="text-sm font-semibold text-foreground">
                        Build your perfect bag
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Mix brands, styles, and categories into one simple, secure checkout.
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Shadow */}
              <div className="absolute inset-x-6 -bottom-6 h-8 rounded-full bg-black/5 dark:bg-black/40 blur-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Stats Bar */}
      <section className="py-10 border-y border-border bg-background flex items-center">
        <div className="container px-8 flex flex-wrap justify-between items-center gap-8">
          {[
            { icon: Award, label: "Top-rated sellers" },
            { icon: Shield, label: "Secure payments" },
            { icon: Zap, label: "Fast checkout" },
            { icon: TrendingUp, label: "New drops weekly" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group cursor-default">
              <div className="p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured / Trending Section */}
      <section className="py-24 relative bg-background overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="container px-8 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <span className="text-xs font-medium text-primary/80 tracking-wide uppercase">
                  Featured products
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Trending right now
              </h2>
            </div>
            <Link href="/products">
              <Button
                variant="outline"
                className="text-xs font-medium gap-2 px-6 h-11 rounded-full"
              >
                View all products
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-24">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-8">
                  <div className="aspect-[4/5] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[56px] border-2 border-slate-50 dark:border-slate-900" />
                  <div className="space-y-4 px-4">
                    <div className="h-10 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-2xl w-3/4" />
                    <div className="h-6 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-xl w-1/2" />
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  key={p.id}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-4">
                <div className="h-16 w-16 bg-background rounded-2xl flex items-center justify-center border border-border">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Products will appear here as soon as they’re added.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-card text-foreground overflow-hidden relative border-y border-border">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[180px] rounded-full translate-x-1/2 translate-y-1/4 pointer-events-none" />
        <div className="container px-8 mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          {[
            { icon: Zap, title: "Fast delivery", desc: "Reliable shipping options with real-time tracking, so you always know where your order is." },
            { icon: Shield, title: "Secure checkout", desc: "Industry-standard encryption and trusted payment providers keep every order safe." },
            { icon: Truck, title: "Easy returns", desc: "Change your mind? Simple, hassle-free returns on eligible items within 30 days." },
          ].map((f, i) => (
          <div key={i} className="space-y-6 group bg-background/60 backdrop-blur-xl p-8 rounded-3xl border border-border hover:border-primary/40 transition-all">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container px-8 mx-auto text-center space-y-10 relative z-10">
          <div className="space-y-3">
            <span className="text-xs font-medium text-primary/80 tracking-wide uppercase">
              Ready when you are
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Create an account and save your favorite finds.
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Keep all your orders, addresses, and wishlists in one place so you can check
            out in a few taps next time.
          </p>
          <div className="flex justify-center flex-wrap gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-12 md:h-14 px-10 rounded-full text-sm font-semibold">
                Create free account
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="h-12 md:h-14 px-10 rounded-full text-sm font-medium"
              >
                Continue as guest
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
