"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Search, ChevronRight, Zap, ArrowRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number;
    image: string;
}

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") ?? "";
    const [inputValue, setInputValue] = useState(query);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setInputValue(query);
        if (!query.trim()) {
            setProducts([]);
            return;
        }
        const fetchResults = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/products?search=${encodeURIComponent(query)}&limit=24`);
                const formatted = data.products.map((p: { id: string; title: string; description: string; price: number; discounted?: number; gallery: string[] }) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    discounted: p.discounted,
                    image: p.gallery && p.gallery.length > 0 ? p.gallery[0] : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop",
                }));
                setProducts(formatted);
                setTotal(data.total);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
        }
    };

    return (
        <div className="bg-white dark:bg-[#050505] min-h-screen pb-40 transition-colors duration-500">
            {/* Architectural Header */}
            <header className="pt-20 pb-16 border-b-2 border-slate-50 dark:border-slate-900 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="container mx-auto px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Discovery Engine</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">Global <br />Archive Search</h1>
                            <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Querying the NexusOS centralized product registry for specific assets.</p>
                        </div>

                        {/* Search bar module */}
                        <form onSubmit={handleSearch} className="w-full md:w-[500px] relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 dark:text-slate-700 transition-colors group-focus-within:text-primary" />
                                <Input
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    placeholder="DESIGNATION QUERY..."
                                    className="pl-20 pr-10 h-20 text-xs font-black tracking-[0.3em] uppercase rounded-[30px] border-4 dark:border-slate-800 bg-white dark:bg-black text-black dark:text-white focus-visible:ring-primary/20 shadow-2xl transition-all"
                                />
                                <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </header>

            <div className="container px-8 py-20 mx-auto max-w-7xl">
                {query && (
                    <div className="mb-16 flex items-center gap-6">
                        <div className="h-12 px-6 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-4 border-2 border-slate-100 dark:border-slate-800">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white whitespace-nowrap">
                                {loading ? "PROBING DATABASE..." : `${total} MATCHES IDENTIFIED`}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-slate-50 dark:bg-slate-900" />
                        <span className="text-sm font-black italic text-slate-300 dark:text-slate-700 uppercase tracking-tighter">Query: &quot;{query}&quot;</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!query ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center py-40 text-center space-y-10"
                        >
                            <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-800">
                                <Search className="h-10 w-10" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Input Query Sequence</h2>
                                <p className="text-base font-medium text-slate-400 dark:text-slate-600 max-w-sm mx-auto italic leading-relaxed">NexustOS awaits your designation parameters to filter the archives.</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
                        >
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-[480px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[40px] border-2 border-slate-50 dark:border-slate-900" />
                                ))
                            ) : products.length > 0 ? (
                                products.map(product => <ProductCard key={product.id} product={product} />)
                            ) : query && !loading ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-40 text-center space-y-10">
                                    <div className="h-24 w-24 bg-rose-50 dark:bg-rose-950/20 border-4 border-rose-100 dark:border-rose-900 rounded-[32px] flex items-center justify-center text-rose-200 dark:text-rose-900">
                                        <Info className="h-10 w-10" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">No Matches Detected</h2>
                                        <p className="text-base font-medium text-slate-400 dark:text-slate-600 max-w-sm mx-auto italic leading-relaxed">The registry contains no assets matching your current query signature.</p>
                                    </div>
                                    <Button variant="outline" onClick={() => setInputValue("")} className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-4">Clear Parameters</Button>
                                </div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense>
            <SearchResults />
        </Suspense>
    );
}
