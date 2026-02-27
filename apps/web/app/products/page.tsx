"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                image: p.gallery?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
            }));

            // Client-side price filter (since backend might not support it yet in the generic query)
            if (minPrice) formatted = formatted.filter((p: any) => (p.discounted || p.price) >= parseFloat(minPrice));
            if (maxPrice) formatted = formatted.filter((p: any) => (p.discounted || p.price) <= parseFloat(maxPrice));

            setProducts(formatted);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, sortBy, sortOrder, minPrice, maxPrice]);

    // Debounce search
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
        <div className="container mx-auto px-4 py-12 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Our Collection</h1>
                    <p className="text-muted-foreground mt-2">Premium lifestyle essentials for the modern world.</p>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-full bg-background"
                        />
                    </div>
                    <Button
                        variant="outline"
                        className={`rounded-full gap-2 ${showFilters ? 'bg-primary/5 border-primary text-primary' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6 border rounded-3xl bg-card shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                        <select
                            className="w-full h-11 px-4 border rounded-2xl bg-background border-input focus:ring-2 focus:ring-primary outline-none text-sm appearance-none"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Price Range</label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Min" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="rounded-2xl" />
                            <Input placeholder="Max" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="rounded-2xl" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Sort By</label>
                        <select
                            className="w-full h-11 px-4 border rounded-2xl bg-background border-input focus:ring-2 focus:ring-primary outline-none text-sm"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split("-");
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A-Z</option>
                            <option value="name-desc">Name: Z-A</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground hover:text-destructive gap-2" onClick={resetFilters}>
                            <X className="h-4 w-4" />
                            Reset All
                        </Button>
                    </div>
                </div>
            )}

            {/* Active Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
                {selectedCategory !== "all" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary capitalize">
                        {categories.find(c => c.id === selectedCategory)?.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                    </div>
                )}
                {sortBy !== "createdAt" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
                        Sorted by {sortBy}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => { setSortBy("createdAt"); setSortOrder("desc"); }} />
                    </div>
                )}
                {(minPrice || maxPrice) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
                        Price: {minPrice || '0'} - {maxPrice || 'Any'}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[400px] bg-muted/40 animate-pulse rounded-3xl" />
                    ))
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product.id} product={product as any} />
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-muted/10 rounded-3xl border border-dashed">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4 text-muted-foreground">
                            <Search className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">No products found</h3>
                        <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
                        <Button variant="link" onClick={resetFilters} className="mt-4">Clear all filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
