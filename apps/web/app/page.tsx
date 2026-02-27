"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Truck, ShoppingCart, Star, Award, TrendingUp, ChevronRight } from "lucide-react";
import Image from "next/image";
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

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
}

export default function Home() {
  const router = useRouter();
  const [storeMode, setStoreMode] = useState<{ mode: string; productId: string | null }>({ mode: 'multi', productId: null });
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeMode.mode === 'single' && storeMode.productId) {
      router.push(`/products/${storeMode.productId}`);
    }
  }, [storeMode, router]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, productsRes, bannersRes] = await Promise.all([
          api.get('/settings').catch(() => ({ data: null })),
          api.get('/products?limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/banners').catch(() => ({ data: [] })),
        ]);

        const settings = settingsRes.data;
        if (settings?.storeMode === 'single' && settings?.singleProductId) {
          setStoreMode({ mode: 'single', productId: settings.singleProductId });
        }

        const formattedProducts = productsRes.data.products?.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          image: p.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
        })) || [];

        setProducts(formattedProducts);
        setBanners(bannersRes.data || []);
      } catch (error) {
        console.error("Critical: Homepage intelligence failure", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#050505] transition-colors duration-500 overflow-x-hidden">
      {/* Cinematic Banner / Hero Section */}
      <section className="relative h-[95vh] min-h-[700px] overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div
              key={banners[activeBanner].id}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={banners[activeBanner].imageUrl}
                alt={banners[activeBanner].title || "Luxury Feature"}
                fill
                unoptimized
                className="object-cover opacity-70"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />

              <div className="container relative z-10 h-full flex flex-col justify-center px-8 md:px-20">
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="max-w-4xl space-y-10"
                >
                  <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-primary" />
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.6em]">
                      {banners[activeBanner].subtitle || "Exclusive Collection"}
                    </span>
                  </div>
                  <h1 className="text-7xl md:text-[10rem] font-black text-white tracking-[ -0.05em] leading-[0.85] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] uppercase">
                    {banners[activeBanner].title || "Define Your <br/> Reality."}
                  </h1>
                  <p className="text-xl md:text-2xl text-white/50 font-medium max-w-xl leading-relaxed italic border-l-4 border-primary/40 pl-8">
                    Experience the nexus of uncompromising luxury and technological advancement.
                  </p>
                  <div className="flex flex-wrap gap-6 pt-10">
                    <Link href={banners[activeBanner].linkUrl || "/products"}>
                      <Button size="lg" className="rounded-[30px] h-20 px-16 gap-4 text-xs font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all active:scale-95 group relative overflow-hidden">
                        <span className="relative z-10">Initialize Discovery</span>
                        <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-2" />
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button variant="outline" size="lg" className="rounded-[30px] h-20 px-16 border-white/10 text-white hover:bg-white hover:text-black transition-all font-black uppercase tracking-widest text-xs bg-white/5 backdrop-blur-xl border-4">
                        Access Archives
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-black to-black transition-colors">
              <div className="container relative z-10">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-primary" />
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">System Core Active</span>
                  </div>
                  <h1 className="text-7xl md:text-[10rem] font-black text-white tracking-tighter leading-[0.85] uppercase">NexusOS <br />Archives</h1>
                  <p className="text-2xl text-white/40 font-medium max-w-2xl italic leading-relaxed border-l-4 border-white/10 pl-8">A curated selection of world-class assets, delivered with unmatched speed and precision across the global network.</p>
                  <div className="pt-10">
                    <Link href="/products">
                      <Button size="lg" className="rounded-[30px] h-20 px-16 gap-6 text-xs font-black uppercase tracking-widest group shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] active:scale-95">
                        <span className="relative z-10">Start Exploration</span>
                        <Zap className="h-5 w-5 fill-current transition-transform group-hover:scale-125" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
              <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </AnimatePresence>

        {/* Progress indicators for banners */}
        {banners.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4 z-30 bg-white/5 backdrop-blur-xl p-3 rounded-full border border-white/10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`group relative h-1.5 transition-all duration-700 overflow-hidden rounded-full ${i === activeBanner ? 'w-20' : 'w-6 hover:w-10'}`}
              >
                <div className="absolute inset-0 bg-white/10" />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: i === activeBanner ? 0 : "-100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="absolute inset-0 bg-primary"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Stats Bar */}
      <section className="py-12 border-b-2 border-slate-50 dark:border-slate-900 bg-white dark:bg-[#050505] flex items-center transition-colors">
        <div className="container px-8 flex flex-wrap justify-between items-center gap-12 opacity-40 dark:opacity-20 transition-all hover:opacity-100 dark:hover:opacity-60 duration-500">
          {[
            { icon: Award, label: "Global Recognition" },
            { icon: Shield, label: "Secure Protocol" },
            { icon: Zap, label: "Instant Response" },
            { icon: TrendingUp, label: "High Velocity" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group cursor-default">
              <div className="p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-black text-[11px] uppercase tracking-[0.4em] text-black dark:text-white transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured / Trending Section */}
      <section className="py-32 relative bg-white dark:bg-[#050505] transition-colors duration-500 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="container px-8 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <span className="text-[10px] font-black uppercase text-primary tracking-[0.5em]">Current Manifest</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-black dark:text-white">Active <br /> Trending.</h2>
            </div>
            <Link href="/products">
              <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest gap-4 bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 px-12 h-20 rounded-[30px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 group">
                Access All Archives <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
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
              <div className="col-span-full py-40 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[64px] border-4 border-dashed border-slate-100 dark:border-slate-900 flex flex-col items-center justify-center gap-8">
                <div className="h-20 w-20 bg-white dark:bg-black rounded-3xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-800">
                  <Package className="h-10 w-10 text-slate-200 dark:text-slate-800" />
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400 dark:text-slate-700 italic">Inventory Synchronization in Progress...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-40 bg-black text-white overflow-hidden relative border-y-4 border-primary/20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/15 blur-[180px] rounded-full translate-x-1/2 translate-y-1/4 pointer-events-none" />
        <div className="container px-8 mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 relative z-10">
          {[
            { icon: Zap, title: "EXPRESS FLOW", desc: "Proprietary logistics engine ensuring delivery cycles under 48 hours for premium members across all hubs." },
            { icon: Shield, title: "IRONCLAD GATEWAY", desc: "Military-grade encryption securing every transaction point and data node in our sovereign network." },
            { icon: Truck, title: "FLUX RETURNS", desc: "No questions asked. Seamless reversal of any acquisition within a 30-day temporal window for full refund." },
          ].map((f, i) => (
            <div key={i} className="space-y-10 group bg-white/5 backdrop-blur-2xl p-12 rounded-[56px] border-2 border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.08]">
              <div className="h-20 w-20 bg-primary/10 border-2 border-primary/30 rounded-[32px] flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(var(--primary),0.3)]">
                <f.icon className="h-10 w-10 text-primary fill-primary/10" />
              </div>
              <div className="space-y-6">
                <h3 className="text-3xl font-black uppercase tracking-[0.2em]">{f.title}</h3>
                <p className="text-white/40 font-medium leading-relaxed italic text-lg lg:text-xl">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-60 bg-white dark:bg-[#050505] transition-colors duration-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/3 pointer-events-none" />

        <div className="container px-8 mx-auto text-center space-y-20 relative z-10">
          <div className="space-y-4">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.8em]">Neural Link Finalization</span>
            <h2 className="text-7xl md:text-[12rem] font-black tracking-[-0.05em] uppercase leading-[0.75] text-black dark:text-white">Join the <br className="hidden md:block" /><span className="text-primary italic">Sovereign.</span></h2>
          </div>
          <p className="text-xl md:text-3xl text-slate-400 dark:text-slate-600 font-medium max-w-3xl mx-auto italic leading-relaxed">
            Establishing your node in the NexusOS ecosystem grants immediate access to the high-velocity archives.
          </p>
          <div className="flex justify-center flex-wrap gap-10 pt-10">
            <Link href="/register">
              <Button size="lg" className="h-24 px-20 rounded-[40px] font-black uppercase tracking-[0.3em] text-[13px] shadow-3xl shadow-primary/40 active:scale-95 transition-all group overflow-hidden relative">
                <span className="relative z-10">Establish Entity</span>
                <ChevronRight className="ml-4 h-6 w-6 relative z-10 transition-transform group-hover:translate-x-2" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-foreground/10 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="lg" className="h-24 px-20 rounded-[40px] font-black uppercase tracking-[0.3em] text-[13px] border-4 border-slate-100 dark:border-slate-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 bg-white/5 backdrop-blur-xl">
                Probe Archives
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Package(props: any) {
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
