"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Search, SlidersHorizontal, RotateCcw, ArrowUpDown, ChevronDown, X, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number;
  image: string;
  category?: string;
  categoryId?: string;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

type ExternalProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number | null;
  gallery?: string[];
  createdAt?: string;
  categoryId?: string;
  category?: { id: string; name: string; slug: string } | null;
};

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isRetryingCategories, setIsRetryingCategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl ?? "all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const fetchCategories = async () => {
    try {
      setCategoriesError(null);
      setIsRetryingCategories(true);
      const { data } = await api.get("/categories");
      setCategories(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load categories";
      setCategoriesError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRetryingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const { data: rawProducts = [], isLoading } = useQuery<ExternalProduct[]>({
    queryKey: ["products-all"],
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: { products?: ExternalProduct[] } = await res.json();
      return data.products ?? [];
    },
  });

  const products = useMemo<Product[]>(() => {
    let formatted: Product[] = rawProducts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      discounted: p.discounted ?? undefined,
      image: p.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      category: p.category?.name,
      categoryId: p.category?.id ?? p.categoryId,
      createdAt: p.createdAt,
    }));

    if (selectedCategory !== "all") formatted = formatted.filter((p) => p.categoryId === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (minPrice) { const min = parseFloat(minPrice); if (!isNaN(min)) formatted = formatted.filter((p) => (p.discounted ?? p.price) >= min); }
    if (maxPrice) { const max = parseFloat(maxPrice); if (!isNaN(max)) formatted = formatted.filter((p) => (p.discounted ?? p.price) <= max); }

    formatted.sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "price") return ((a.discounted ?? a.price) - (b.discounted ?? b.price)) * dir;
      if (sortBy === "name") return a.title.localeCompare(b.title) * dir;
      return ((a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)) * dir;
    });

    return formatted.slice(0, 50);
  }, [rawProducts, selectedCategory, search, minPrice, maxPrice, sortBy, sortOrder]);

  const resetFilters = () => {
    setSearch(""); setSelectedCategory("all"); setMinPrice(""); setMaxPrice("");
    setSortBy("createdAt"); setSortOrder("desc");
  };

  const hasActiveFilters = search || selectedCategory !== "all" || minPrice || maxPrice || sortBy !== "createdAt";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        :root {
          --ink: #0a0a0a;
          --paper: #f5f3ef;
          --accent: #c8ff00;
          --mid: #8a8a8a;
          --border: rgba(10,10,10,0.1);
          --card: #fff;
        }

        .pp-wrap { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
        .font-display { font-family: 'Barlow Condensed', sans-serif; }

        /* ── HEADER ── */
        .pp-header {
          background: var(--ink);
          padding: 80px 0 52px;
          position: relative;
          overflow: hidden;
        }
        .pp-header-noise {
          position: absolute; inset: 0; opacity: .03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .pp-header-accent {
          position: absolute; top: -60px; right: -60px;
          width: 320px; height: 320px; border-radius: 50%;
          background: var(--accent); opacity: .08; pointer-events: none;
          filter: blur(80px);
        }

        /* ── SEARCH BAR ── */
        .pp-search {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
          border-radius: 6px; height: 48px; overflow: hidden;
          transition: border-color .2s;
        }
        .pp-search:focus-within { border-color: var(--accent); }
        .pp-search input {
          flex: 1; background: transparent; border: none; outline: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #fff;
          padding: 0 16px; height: 100%;
        }
        .pp-search input::placeholder { color: rgba(255,255,255,.35); }
        .pp-search-icon { padding: 0 14px; color: rgba(255,255,255,.4); flex-shrink: 0; }

        .pp-filter-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          padding: 0 20px; height: 48px; border-radius: 6px;
          cursor: pointer; transition: background .2s, color .2s; border: none;
          flex-shrink: 0;
        }
        .pp-filter-btn.off { background: transparent; color: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.15); }
        .pp-filter-btn.on  { background: var(--accent); color: var(--ink); }

        /* ── FILTER PANEL ── */
        .pp-filters {
          background: var(--card); border-bottom: 1px solid var(--border);
          padding: 32px;
        }
        .pp-filters-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; align-items: end; }

        .pp-label { font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--mid); margin-bottom: 8px; display: block; }

        .pp-select-wrap { position: relative; }
        .pp-select {
          width: 100%; height: 42px; padding: 0 40px 0 14px;
          border: 1.5px solid var(--border); border-radius: 6px;
          background: var(--paper); color: var(--ink);
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400;
          appearance: none; outline: none; cursor: pointer;
          transition: border-color .2s;
        }
        .pp-select:focus { border-color: var(--ink); }
        .pp-select-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--mid); }

        .pp-input {
          width: 100%; height: 42px; padding: 0 14px;
          border: 1.5px solid var(--border); border-radius: 6px;
          background: var(--paper); color: var(--ink);
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          outline: none; transition: border-color .2s;
        }
        .pp-input:focus { border-color: var(--ink); }
        .pp-input::placeholder { color: #bbb; }

        .pp-reset-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: .08em; text-transform: uppercase;
          padding: 0 18px; height: 42px; border-radius: 6px;
          border: 1.5px dashed rgba(10,10,10,.2); background: transparent; color: var(--mid);
          cursor: pointer; transition: border-color .2s, color .2s; white-space: nowrap;
        }
        .pp-reset-btn:hover { border-color: var(--ink); color: var(--ink); }

        /* ── TOOLBAR ── */
        .pp-toolbar {
          max-width: 1400px; margin: 0 auto;
          padding: 28px 32px 0;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .pp-count {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 900; line-height: 1;
          margin-right: 8px;
        }
        .pp-count-label { font-size: 13px; color: var(--mid); font-weight: 300; }
        .pp-divider-v { width: 1px; height: 24px; background: var(--border); flex-shrink: 0; }

        /* Category pills */
        .pp-pill {
          display: inline-flex; align-items: center;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: .06em; text-transform: uppercase;
          padding: 7px 16px; border-radius: 999px;
          cursor: pointer; border: 1.5px solid transparent;
          transition: background .2s, color .2s, border-color .2s; white-space: nowrap;
        }
        .pp-pill.active { background: var(--ink); color: #fff; border-color: var(--ink); }
        .pp-pill.inactive { background: transparent; color: var(--mid); border-color: var(--border); }
        .pp-pill.inactive:hover { border-color: var(--ink); color: var(--ink); }

        /* Active filter tags */
        .pp-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 999px;
          background: var(--accent); color: var(--ink); cursor: pointer;
        }

        /* ── GRID ── */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          max-width: 1400px; margin: 0 auto; padding: 32px 32px 80px;
        }
        @media (min-width: 768px) { .pp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .pp-grid { grid-template-columns: repeat(4, 1fr); gap: 28px; } }

        /* Skeleton */
        .pp-skeleton { border-radius: 12px; background: rgba(10,10,10,.06); animation: pp-pulse 1.4s ease-in-out infinite; }
        @keyframes pp-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* Empty state */
        .pp-empty {
          grid-column: 1/-1; text-align: center; padding: 80px 24px;
          border: 1.5px dashed var(--border); border-radius: 12px;
        }
        .pp-empty-icon {
          width: 64px; height: 64px; border-radius: 12px;
          background: rgba(10,10,10,.05); display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; color: var(--mid);
        }
        .pp-empty h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; }
        .pp-empty p { font-size: 14px; color: var(--mid); font-weight: 300; max-width: 320px; margin: 0 auto 32px; }
        .pp-empty-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          padding: 13px 28px; border-radius: 6px; background: var(--ink); color: #fff; border: none; cursor: pointer;
          transition: opacity .2s;
        }
        .pp-empty-btn:hover { opacity: .8; }
      `}</style>

      <div className="pp-wrap">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="pp-header">
          <div className="pp-header-noise" />
          <div className="pp-header-accent" />
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)", display: "block", marginBottom: 16 }}>
              Full Catalog
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
              <div>
                <h1 className="font-display" style={{ fontSize: "clamp(44px, 7vw, 80px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1, letterSpacing: "-.01em", marginBottom: 12 }}>
                  All Products
                </h1>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 16, fontWeight: 300, maxWidth: 440 }}>
                  Browse the full catalog. Filter by category, price, or search for something specific.
                </p>
              </div>

              {/* Search + filter trigger */}
              <div style={{ display: "flex", gap: 10, flex: "0 0 auto", width: "100%", maxWidth: 480 }}>
                <div className="pp-search" style={{ flex: 1 }}>
                  <span className="pp-search-icon"><Search size={16} /></span>
                  <input
                    placeholder="Search products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} style={{ padding: "0 12px", color: "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  className={`pp-filter-btn ${showFilters ? "on" : "off"}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasActiveFilters && !showFilters && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── FILTER PANEL ────────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="pp-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: .3, ease: [.4, 0, .2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="pp-filters-inner">
                {/* Category */}
                <div>
                  <span className="pp-label">Category</span>
                  {categoriesError ? (
                    <div style={{ 
                      padding: "8px 12px", 
                      borderRadius: "6px", 
                      background: "rgba(239, 68, 68, 0.1)", 
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      fontSize: "12px",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px"
                    }}>
                      <AlertCircle size={14} />
                      <span>{categoriesError}</span>
                      <button
                        onClick={fetchCategories}
                        disabled={isRetryingCategories}
                        style={{
                          marginLeft: "auto",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#dc2626",
                          fontSize: "11px",
                          cursor: isRetryingCategories ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <RefreshCw size={12} style={{ 
                          animation: isRetryingCategories ? "spin 1s linear infinite" : "none" 
                        }} />
                        {isRetryingCategories ? "Retrying..." : "Retry"}
                      </button>
                    </div>
                  ) : (
                    <div className="pp-select-wrap">
                      <select className="pp-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="all">All Products</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="pp-select-chevron" />
                    </div>
                  )}
                </div>

                {/* Price range */}
                <div>
                  <span className="pp-label">Min Price</span>
                  <input className="pp-input" placeholder="$0" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
                <div>
                  <span className="pp-label">Max Price</span>
                  <input className="pp-input" placeholder="Any" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>

                {/* Sort */}
                <div>
                  <span className="pp-label">Sort By</span>
                  <div className="pp-select-wrap">
                    <select className="pp-select" value={`${sortBy}-${sortOrder}`} onChange={(e) => { const [f, o] = e.target.value.split("-"); setSortBy(f); setSortOrder(o); }}>
                      <option value="createdAt-desc">Newest First</option>
                      <option value="price-asc">Price: Low → High</option>
                      <option value="price-desc">Price: High → Low</option>
                      <option value="name-asc">Name: A–Z</option>
                      <option value="name-desc">Name: Z–A</option>
                    </select>
                    <ArrowUpDown size={14} className="pp-select-chevron" />
                  </div>
                </div>

                {/* Reset */}
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="pp-reset-btn" onClick={resetFilters}>
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TOOLBAR: count + category pills ─────────────────────── */}
        <div className="pp-toolbar">
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="pp-count">{isLoading ? "—" : products.length}</span>
            <span className="pp-count-label">{products.length === 1 ? "product" : "products"}</span>
          </div>

          <div className="pp-divider-v" />

          {/* Category pills - scrollable */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, flexWrap: "nowrap" }}>
            <button className={`pp-pill ${selectedCategory === "all" ? "active" : "inactive"}`} onClick={() => setSelectedCategory("all")}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} className={`pp-pill ${selectedCategory === c.id ? "active" : "inactive"}`} onClick={() => setSelectedCategory(c.id)}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Active filter tags */}
          {search && (
            <button className="pp-tag" onClick={() => setSearch("")}>
              &quot;{search}&quot; <X size={11} />
            </button>
          )}
          {(minPrice || maxPrice) && (
            <button className="pp-tag" onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
              {minPrice ? `$${minPrice}` : "$0"} – {maxPrice ? `$${maxPrice}` : "any"} <X size={11} />
            </button>
          )}
        </div>

        {/* ── PRODUCT GRID ─────────────────────────────────────────── */}
        <div className="pp-grid">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pp-skeleton" style={{ aspectRatio: "3/4" }} />
            ))
          ) : products.length > 0 ? (
            products.map((product: Product, i: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          ) : (
            <div className="pp-empty">
              <div className="pp-empty-icon">
                <RotateCcw size={28} />
              </div>
              <h3>No Products Found</h3>
              <p>Try adjusting your filters or clearing them to see more results.</p>
              <button className="pp-empty-btn" onClick={resetFilters}>
                <RotateCcw size={13} /> Clear Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

function ProductsPageFallback() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f5f3ef", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#8a8a8a" }}>Loading products…</div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}