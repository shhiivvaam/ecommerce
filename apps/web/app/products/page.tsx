"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, ArrowUpDown, ChevronDown, LayoutGrid, ListFilter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number;
    image: string;
    category?: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    _count?: { products: number };
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Fetch categories
    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => { });
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: 50,
                sortBy,
                sortOrder,
                ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
                ...(search && { search }),
            };

            const { data } = await api.get('/products', { params });

            let formatted = data.products.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                price: p.price,
                discounted: p.discounted,
                image: p.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
            }));

            if (minPrice) formatted = formatted.filter((p: any) => (p.discounted || p.price) >= parseFloat(minPrice));
            if (maxPrice) formatted = formatted.filter((p: any) => (p.discounted || p.price) <= parseFloat(maxPrice));

            setProducts(formatted);
        } catch (error) {
            console.error("Gallery synchronization failed", error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, sortBy, sortOrder, minPrice, maxPrice]);

    const timerRef = useRef<NodeJS.Timeout>();
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(fetchProducts, 400);
        return () => clearTimeout(timerRef.current);
    }, [fetchProducts]);

    const resetFilters = () => {
        setSearch("");
        setSelectedCategory("all");
        setMinPrice("");
        setMaxPrice("");
        setSortBy("createdAt");
        setSortOrder("desc");
    };

    return (
        <div className="bg-white dark:bg-[#050505] min-h-screen pb-40 transition-colors duration-500">
            {/* Architectural Header */}
            <header className="pt-20 pb-16 border-b-2 border-slate-50 dark:border-slate-900 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="container mx-auto px-8 relative z-10">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Resource Gallery</span>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                            <div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">The Master <br />Archives</h1>
                                <p className="text-lg text-slate-400 dark:text-slate-500 font-medium mt-6 max-w-xl italic leading-relaxed">A curated ecosystem of meticulously engineered products for the modern individual.</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-2 flex items-center shadow-sm w-full md:w-auto transition-colors">
                                <Search className="ml-6 h-5 w-5 text-slate-300 dark:text-slate-600" />
                                <input
                                    placeholder="Search the archives..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent h-16 px-6 text-sm font-black uppercase tracking-widest outline-none w-full md:w-64 placeholder:text-slate-300 dark:placeholder:text-slate-600 text-black dark:text-white"
                                />
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`h-16 px-8 rounded-[24px] gap-3 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${showFilters ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-black dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 shadow-none'}`}
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filter Engine
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-8 mt-12">
                {/* Control Panel (Filters) */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-[40px] p-10 mb-16 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                <ListFilter className="h-48 w-48 rotate-12 text-black dark:text-white" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Classification</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-14 pl-6 pr-12 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-black rounded-2xl outline-none font-black uppercase tracking-widest text-[10px] appearance-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                        >
                                            <option value="all">All Archives</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Valuation Range</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input placeholder="MIN" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="rounded-2xl h-14 border-2 dark:border-slate-800 bg-white dark:bg-black font-black uppercase tracking-widest text-[10px] text-center" />
                                        <Input placeholder="MAX" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="rounded-2xl h-14 border-2 dark:border-slate-800 bg-white dark:bg-black font-black uppercase tracking-widest text-[10px] text-center" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Sort Protocol</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-14 pl-6 pr-12 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-black rounded-2xl outline-none font-black uppercase tracking-widest text-[10px] appearance-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                                            value={`${sortBy}-${sortOrder}`}
                                            onChange={(e) => {
                                                const [field, order] = e.target.value.split("-");
                                                setSortBy(field);
                                                setSortOrder(order);
                                            }}
                                        >
                                            <option value="createdAt-desc">Newest Acquisitions</option>
                                            <option value="price-asc">Valuation: Lo-Hi</option>
                                            <option value="price-desc">Valuation: Hi-Lo</option>
                                            <option value="name-asc">Alphabetical: A-Z</option>
                                            <option value="name-desc">Alphabetical: Z-A</option>
                                        </select>
                                        <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <Button
                                        variant="ghost"
                                        className="h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 transition-all dark:text-slate-400"
                                        onClick={resetFilters}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset Engine
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Listing Stats */}
                <div className="flex justify-between items-center mb-10 overflow-x-auto no-scrollbar gap-8">
                    <div className="flex items-center gap-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">Viewing</span>
                            <span className="text-xl font-black text-black dark:text-white">{products.length}</span>
                        </div>
                        <span className="h-6 w-px bg-slate-100 dark:bg-slate-900" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedCategory("all")}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === "all" ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                All Archives
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCategory(c.id)}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === c.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 text-slate-300 dark:text-slate-800">
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-20">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-6">
                                <div className="aspect-[4/5] bg-slate-50 dark:bg-slate-900 animate-pulse rounded-[40px] border-2 border-slate-50 dark:border-slate-800" />
                                <div className="h-8 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-full w-2/3" />
                                <div className="h-12 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-full w-1/3" />
                            </div>
                        ))
                    ) : products.length > 0 ? (
                        products.map((product, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={product.id}
                            >
                                <ProductCard product={product as any} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-40 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[60px] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                            <div className="h-24 w-24 bg-white dark:bg-slate-800 shadow-md rounded-3xl flex items-center justify-center mx-auto mb-10 text-slate-200 dark:text-slate-700">
                                <RotateCcw className="h-12 w-12" />
                            </div>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Null Result.</h3>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 italic leading-relaxed">No assets match the current filtration parameters.</p>
                            <Button
                                onClick={resetFilters}
                                className="mt-12 rounded-[24px] h-16 px-12 font-black uppercase tracking-widest text-[10px] transition-transform active:scale-95 shadow-2xl"
                            >
                                Re-Initialize Archives
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
