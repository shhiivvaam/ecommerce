"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Search, ArrowRight, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number;
  image: string;
}

type ExternalProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number | null;
  gallery?: string[];
};

type ProductsResponse = {
  products?: ExternalProduct[];
  total?: number;
};

/* ── Skeleton Card ─────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid rgba(10,10,10,.08)",
      borderRadius: 8,
      overflow: "hidden",
      animation: "sp-pulse 1.6s ease-in-out infinite"
    }}>
      <div style={{ height: 280, background: "#ede9e3" }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 14, background: "#ede9e3", borderRadius: 4, width: "70%" }} />
        <div style={{ height: 11, background: "#ede9e3", borderRadius: 4, width: "45%" }} />
      </div>
    </div>
  );
}

/* ── Main Search Component ─────────────── */
function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(query);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["search-products", query],
    enabled: !!query.trim(),
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const products: Product[] = useMemo(() => {
    if (!query.trim() || !data?.products) return [];
    const q = query.toLowerCase();
    return data.products
      .filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        discounted: p.discounted ?? undefined,
        image: p.gallery?.[0] ?? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop",
      }));
  }, [data, query]);

  const total = products.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const clearInput = () => {
    setInputValue("");
    router.push("/search");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        :root {
          --ink: #0a0a0a;
          --paper: #f5f3ef;
          --accent: #c8ff00;
          --mid: #8a8a8a;
          --border: rgba(10,10,10,0.1);
          --card: #fff;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-wrap {
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
        }

        /* ── Header ── */
        .sp-header {
          background: var(--ink);
          padding: 80px 0 52px;
          position: relative;
          overflow: hidden;
        }
        .sp-header-noise {
          position: absolute; inset: 0; opacity: .03; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .sp-header-inner {
          max-width: 1400px; margin: 0 auto; padding: 0 32px;
          position: relative; z-index: 1;
        }

        .sp-eyebrow {
          display: inline-flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
        }
        .sp-eyebrow-line { height: 1px; width: 40px; background: rgba(255,255,255,.2); }
        .sp-eyebrow-label {
          font-size: 10px; font-weight: 500; letter-spacing: .4em;
          text-transform: uppercase; color: var(--accent);
        }

        .sp-headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(52px, 8vw, 96px);
          font-weight: 900;
          text-transform: uppercase;
          line-height: .95;
          letter-spacing: -.01em;
          color: #fff;
          margin-bottom: 40px;
        }
        .sp-headline span {
          color: rgba(255,255,255,.18);
        }

        /* search form */
        .sp-form { position: relative; max-width: 600px; }
        .sp-form-inner {
          display: flex; align-items: center;
          background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 8px;
          padding: 0 20px;
          height: 60px;
          gap: 14px;
          transition: border-color .25s, background .25s;
        }
        .sp-form-inner:focus-within {
          border-color: rgba(200,255,0,.4);
          background: rgba(255,255,255,.09);
        }
        .sp-search-icon { color: rgba(255,255,255,.3); flex-shrink: 0; transition: color .2s; }
        .sp-form-inner:focus-within .sp-search-icon { color: var(--accent); }

        .sp-input {
          flex: 1;
          background: transparent; border: none; outline: none;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .04em;
        }
        .sp-input::placeholder { color: rgba(255,255,255,.2); }

        .sp-clear-btn {
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,.3); display: flex; align-items: center;
          padding: 4px; border-radius: 4px;
          transition: color .2s;
        }
        .sp-clear-btn:hover { color: rgba(255,255,255,.7); }

        .sp-submit {
          width: 44px; height: 44px; border-radius: 6px; flex-shrink: 0;
          background: var(--accent); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink); transition: opacity .2s, transform .15s;
        }
        .sp-submit:hover { opacity: .88; transform: translateY(-1px); }

        /* ── Body ── */
        .sp-body { max-width: 1400px; margin: 0 auto; padding: 48px 32px 96px; }

        /* status bar */
        .sp-status {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 40px;
        }
        .sp-status-pill {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 0 18px; height: 38px;
          background: var(--ink); border-radius: 6px;
          white-space: nowrap;
        }
        .sp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .sp-status-text { font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.7); }
        .sp-status-line { flex: 1; height: 1px; background: var(--border); }
        .sp-status-query {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .06em; color: var(--mid);
        }

        /* product grid */
        .sp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        /* empty / idle states */
        .sp-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          padding: 120px 24px; gap: 24px;
        }
        .sp-empty-icon {
          width: 80px; height: 80px; border-radius: 12px;
          border: 1.5px solid var(--border); background: var(--card);
          display: flex; align-items: center; justify-content: center;
          color: var(--mid);
        }
        .sp-empty-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 44px; font-weight: 900;
          text-transform: uppercase; line-height: 1; margin-bottom: 10px;
        }
        .sp-empty-sub { font-size: 14px; font-weight: 300; color: var(--mid); max-width: 300px; }

        .sp-empty-btn {
          padding: 13px 32px; border-radius: 6px;
          background: transparent; border: 1.5px solid var(--border);
          color: var(--ink); cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background .2s, border-color .2s;
          margin-top: 8px;
        }
        .sp-empty-btn:hover { background: var(--ink); border-color: var(--ink); color: #fff; }

        /* pulse skeleton */
        @keyframes sp-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        @media(max-width:640px) {
          .sp-header { padding: 60px 0 36px; }
          .sp-header-inner, .sp-body { padding-left: 20px; padding-right: 20px; }
          .sp-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
      `}</style>

      <div className="sp-wrap">

        {/* ── HEADER ── */}
        <header className="sp-header">
          <div className="sp-header-noise" />
          <div className="sp-header-inner">
            <div className="sp-eyebrow">
              <span className="sp-eyebrow-line" />
              <span className="sp-eyebrow-label">Search</span>
            </div>

            <motion.h1
              className="sp-headline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5 }}
            >
              Find Your<br />
              <span>Next</span> Piece
            </motion.h1>

            <motion.form
              className="sp-form"
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5, delay: .1 }}
            >
              <div className="sp-form-inner">
                <Search size={18} className="sp-search-icon" />
                <input
                  className="sp-input"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Search products…"
                  autoFocus
                />
                <AnimatePresence>
                  {inputValue && (
                    <motion.button
                      type="button"
                      className="sp-clear-btn"
                      onClick={clearInput}
                      initial={{ opacity: 0, scale: .8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: .8 }}
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
                <button type="submit" className="sp-submit">
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.form>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="sp-body">

          {/* status bar */}
          <AnimatePresence>
            {query && (
              <motion.div
                className="sp-status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="sp-status-pill">
                  <motion.span
                    className="sp-status-dot"
                    animate={isLoading ? { opacity: [1, .2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: .9 }}
                  />
                  <span className="sp-status-text">
                    {isLoading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <span className="sp-status-line" />
                <span className="sp-status-query">&quot;{query}&quot;</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* Idle — no query */}
            {!query && (
              <motion.div
                key="idle"
                className="sp-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="sp-empty-icon"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                >
                  <Search size={30} />
                </motion.div>
                <div>
                  <p className="sp-empty-title">Start Searching</p>
                  <p className="sp-empty-sub">Type a product name, category, or keyword above.</p>
                </div>
              </motion.div>
            )}

            {/* Loading skeletons */}
            {query && isLoading && (
              <motion.div
                key="loading"
                className="sp-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            )}

            {/* Results */}
            {query && !isLoading && products.length > 0 && (
              <motion.div
                key="results"
                className="sp-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* No results */}
            {query && !isLoading && products.length === 0 && (
              <motion.div
                key="empty"
                className="sp-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="sp-empty-icon" style={{ borderColor: "rgba(225,29,72,.15)", background: "#fff0f3", color: "#e11d48" }}>
                  <Info size={30} />
                </div>
                <div>
                  <p className="sp-empty-title">No Results</p>
                  <p className="sp-empty-sub">Nothing matched &quot;<strong>{query}</strong>&quot;. Try a different term.</p>
                </div>
                <button className="sp-empty-btn" onClick={clearInput}>
                  <X size={13} /> Clear Search
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
