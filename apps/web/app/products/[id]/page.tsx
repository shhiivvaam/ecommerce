"use client";

import { useEffect, useState, useCallback, useMemo, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { ShoppingBag, Star, ShieldCheck, Truck, ArrowLeft, Send, Heart, ChevronRight, Zap, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { ProductCard } from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";

interface Variant {
  id: string;
  size?: string;
  color?: string;
  sku?: string;
  stock: number;
  priceDiff: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number;
  image: string;
  gallery: string[];
  stock: number;
  category?: { id: string; name: string; slug: string };
  variants?: Variant[];
}

interface RelatedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number;
  gallery: string[];
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { id: string; name?: string; avatar?: string };
}

type ExternalProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number | null;
  gallery?: string[];
  stock?: number;
  variants?: Variant[];
  category?: { id: string; name: string; slug: string } | null;
  createdAt?: string;
};

const FALLBACK = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, user } = useAuthStore();

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${id}/reviews`);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
    } catch (err) {
      console.error("Reviews fetch failed", err);
    }
  }, [id]);

  const { data: productsData, isLoading } = useQuery<{ products?: ExternalProduct[] }>({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const product: Product | null = useMemo(() => {
    if (!productsData?.products) return null;
    const raw = productsData.products.find((p) => p.id === id);
    if (!raw) return null;
    return {
      id: raw.id, title: raw.title, description: raw.description,
      price: raw.price, discounted: raw.discounted ?? undefined,
      image: raw.gallery?.[0] || FALLBACK,
      gallery: raw.gallery?.length ? raw.gallery : [FALLBACK],
      stock: raw.stock ?? 0,
      category: raw.category ?? undefined,
      variants: raw.variants ?? [],
    };
  }, [productsData, id]);

  const relatedProducts: RelatedProduct[] = useMemo(() => {
    if (!productsData?.products || !product?.category?.id) return [];
    return productsData.products
      .filter((p) => p.id !== product.id && p.category?.id === product.category!.id)
      .slice(0, 4)
      .map((p) => ({ id: p.id, title: p.title, description: p.description, price: p.price, discounted: p.discounted ?? undefined, gallery: p.gallery || [] }));
  }, [productsData, product]);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      api.get(`/wishlist/${id}/check`).then(({ data }) => setWishlisted(data.inWishlist)).catch(() => { });
    }
  }, [id, isAuthenticated, fetchReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    const base = product.discounted ?? product.price;
    const price = base + (selectedVariant?.priceDiff ?? 0);
    addItem({
      productId: product.id,
      title: product.title + (selectedVariant ? ` (${[selectedVariant.size, selectedVariant.color].filter(Boolean).join(", ")})` : ""),
      price, quantity, image: product.image,
    });
    toast.success("Added to bag");
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { toast.error("Sign in to save favorites"); return; }
    if (!product) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) { await api.delete(`/wishlist/${product.id}`); setWishlisted(false); toast.success("Removed from favorites"); }
      else { await api.post(`/wishlist/${product.id}`); setWishlisted(true); toast.success("Saved to favorites"); }
    } catch { toast.error("Something went wrong"); }
    finally { setWishlistLoading(false); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating) { toast.error("Please select a rating"); return; }
    setIsSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating: userRating, comment: userComment });
      toast.success("Review submitted");
      setUserRating(0); setUserComment("");
      await fetchReviews();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg || "Unable to submit review");
    } finally { setIsSubmittingReview(false); }
  };

  const basePrice = product?.discounted ?? product?.price ?? 0;
  const displayPrice = basePrice + (selectedVariant?.priceDiff ?? 0);
  const originalPrice = product?.discounted ? product.price + (selectedVariant?.priceDiff ?? 0) : undefined;
  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const sizes = Array.from(new Set((product?.variants ?? []).map((v) => v.size).filter((s): s is string => Boolean(s))));
  const colors = Array.from(new Set((product?.variants ?? []).map((v) => v.color).filter((c): c is string => Boolean(c))));
  const discountPct = product?.discounted ? Math.round((1 - product.discounted / product.price) * 100) : 0;

  /* ─── LOADING ────────────────────────────────────────────── */
  if (isLoading) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div style={{ background: "var(--paper,#f5f3ef)", minHeight: "100vh", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div style={{ aspectRatio: "4/5", borderRadius: 12, background: "rgba(10,10,10,.07)", animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[80, 200, 120, 60].map((h, i) => <div key={i} style={{ height: h, borderRadius: 8, background: "rgba(10,10,10,.07)", animation: "pulse 1.4s ease-in-out infinite" }} />)}
          </div>
        </div>
      </div>
    </>
  );

  if (!product) return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: "'DM Sans',sans-serif" }}>
      <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 56, fontWeight: 900, textTransform: "uppercase" }}>Product Not Found</h1>
      <p style={{ color: "#8a8a8a", fontSize: 16 }}>This product may have been removed or is unavailable.</p>
      <Link href="/products"><button style={{ padding: "13px 32px", borderRadius: 6, background: "#0a0a0a", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase" }}>Back to Products</button></Link>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); --card:#fff; }
        .pd-wrap { font-family:'DM Sans',sans-serif; background:var(--paper); color:var(--ink); min-height:100vh; }
        .font-display { font-family:'Barlow Condensed',sans-serif; }

        /* breadcrumb */
        .pd-breadcrumb { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--mid); }
        .pd-breadcrumb a { color:var(--mid); text-decoration:none; transition:color .2s; }
        .pd-breadcrumb a:hover { color:var(--ink); }
        .pd-back {
          display:inline-flex; align-items:center; gap:8px;
          font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase;
          color:var(--mid); text-decoration:none; transition:color .2s;
        }
        .pd-back:hover { color:var(--ink); }
        .pd-back-icon {
          width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          transition:background .2s, border-color .2s;
        }
        .pd-back:hover .pd-back-icon { background:var(--ink); border-color:var(--ink); color:#fff; }

        /* Gallery */
        .pd-gallery-main {
          position:relative; border-radius:12px; overflow:hidden;
          background:#ede9e3; aspect-ratio:1/1; max-height:380px;
        }
        .pd-badge {
          position:absolute; top:16px; left:16px; z-index:5;
          font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase;
          padding:5px 14px; border-radius:4px;
          background:var(--accent); color:var(--ink);
        }
        .pd-stock-badge {
          position:absolute; top:16px; right:16px; z-index:5;
          font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase;
          padding:5px 12px; border-radius:4px;
          background:#fff3f3; color:#c00; border:1px solid rgba(200,0,0,.15);
        }
        .pd-thumb {
          position:relative; aspect-ratio:1/1; border-radius:8px; overflow:hidden;
          border:2px solid transparent; cursor:pointer;
          transition:border-color .2s, opacity .2s;
          flex-shrink:0; width:60px;
        }
        .pd-thumb.active { border-color:var(--ink); }
        .pd-thumb.inactive { opacity:.55; }
        .pd-thumb.inactive:hover { opacity:1; }

        /* Info side */
        .pd-category-tag {
          display:inline-flex; align-items:center;
          font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase;
          padding:5px 14px; border-radius:999px;
          background:rgba(200,255,0,.18); color:#5a6e00; border:1px solid rgba(200,255,0,.4);
        }
        .pd-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(36px,5vw,56px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.01em; }
        .pd-price { font-family:'Barlow Condensed',sans-serif; font-size:42px; font-weight:900; line-height:1; }
        .pd-price-orig { font-family:'DM Sans',sans-serif; font-size:20px; font-weight:300; color:var(--mid); text-decoration:line-through; }

        /* Stars */
        .pd-star { color:#0a0a0a; }
        .pd-star.empty { color:rgba(10,10,10,.12); }

        /* Description box */
        .pd-desc-box {
          border:1.5px solid var(--border); border-radius:8px;
          padding:24px; background:#fff;
        }
        .pd-desc-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); margin-bottom:12px; display:block; }

        /* Variant pills */
        .pd-size-btn {
          height:40px; min-width:56px; padding:0 16px; border-radius:6px;
          border:1.5px solid var(--border); background:transparent;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.06em; text-transform:uppercase;
          cursor:pointer; transition:background .2s, border-color .2s, color .2s;
          white-space:nowrap; flex-shrink:0;
        }
        .pd-size-btn.active { background:var(--ink); border-color:var(--ink); color:#fff; }
        .pd-size-btn.inactive { color:var(--mid); }
        .pd-size-btn.inactive:hover { border-color:var(--ink); color:var(--ink); }

        .pd-color-btn {
          display:inline-flex; align-items:center; gap:10px;
          height:40px; padding:0 16px 0 6px; border-radius:6px;
          border:1.5px solid var(--border); background:transparent;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
          cursor:pointer; transition:border-color .2s; flex-shrink:0;
        }
        .pd-color-btn.active { border-color:var(--ink); background:#fff; }
        .pd-color-btn.inactive:hover { border-color:rgba(10,10,10,.3); }
        .pd-color-swatch { width:28px; height:28px; border-radius:4px; border:1px solid rgba(10,10,10,.1); flex-shrink:0; }

        /* Qty */
        .pd-qty { display:inline-flex; align-items:center; border:1.5px solid var(--border); border-radius:6px; overflow:hidden; }
        .pd-qty-btn { width:42px; height:46px; display:flex; align-items:center; justify-content:center; background:transparent; border:none; cursor:pointer; color:var(--ink); transition:background .2s; }
        .pd-qty-btn:hover { background:rgba(10,10,10,.05); }
        .pd-qty-val { width:40px; text-align:center; font-size:15px; font-weight:500; border:none; background:transparent; color:var(--ink); }

        /* CTA buttons */
        .pd-add-btn {
          flex:1; height:52px; border-radius:6px; border:none;
          background:var(--ink); color:#fff; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          letter-spacing:.1em; text-transform:uppercase;
          display:flex; align-items:center; justify-content:center; gap:10px;
          transition:background .2s, transform .15s;
        }
        .pd-add-btn:hover:not(:disabled) { background:#222; transform:translateY(-1px); }
        .pd-add-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pd-add-btn.accent { background:var(--accent); color:var(--ink); }
        .pd-add-btn.accent:hover:not(:disabled) { opacity:.88; background:var(--accent); }

        .pd-wish-btn {
          width:52px; height:52px; border-radius:6px; flex-shrink:0;
          border:1.5px solid var(--border); background:transparent; cursor:pointer;
          display:flex; align-items:center; justify-content:center; color:var(--mid);
          transition:border-color .2s, color .2s, background .2s;
        }
        .pd-wish-btn:hover { border-color:#e11d48; color:#e11d48; }
        .pd-wish-btn.wishlisted { border-color:#e11d48; color:#e11d48; background:#fff0f3; }

        /* Trust strip */
        .pd-trust { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-top:32px; }
        .pd-trust-item { background:var(--card); padding:20px; display:flex; align-items:flex-start; gap:14px; }
        .pd-trust-icon { width:36px; height:36px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pd-trust-label { font-size:13px; font-weight:500; margin-bottom:4px; }
        .pd-trust-desc { font-size:11px; color:var(--mid); font-weight:300; line-height:1.5; }

        /* Reviews */
        .pd-review-card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:28px; display:flex; gap:20px; }
        .pd-review-avatar { width:48px; height:48px; border-radius:8px; background:var(--paper); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:18px; flex-shrink:0; }

        /* Review form */
        .pd-review-form { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:28px; position:sticky; top:84px; }
        .pd-star-btn { width:38px; height:38px; border-radius:6px; border:1.5px solid var(--border); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:border-color .2s, background .2s; }
        .pd-star-btn.on { background:var(--ink); border-color:var(--ink); color:#fff; }
        .pd-star-btn.off { color:rgba(10,10,10,.25); }
        .pd-star-btn.off:hover { border-color:var(--ink); }
        .pd-textarea { width:100%; min-height:140px; border:1.5px solid var(--border); border-radius:8px; padding:16px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:300; color:var(--ink); background:var(--paper); resize:none; outline:none; transition:border-color .2s; }
        .pd-textarea:focus { border-color:var(--ink); }
        .pd-textarea::placeholder { color:rgba(10,10,10,.3); }
        .pd-submit-btn { width:100%; height:48px; border-radius:6px; border:none; background:var(--ink); color:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:10px; transition:background .2s; }
        .pd-submit-btn:hover:not(:disabled) { background:#222; }
        .pd-submit-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Section headings */
        .pd-section-tag { font-size:11px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); display:block; margin-bottom:12px; }
        .pd-section-head { font-family:'Barlow Condensed',sans-serif; font-size:clamp(32px,5vw,48px); font-weight:900; text-transform:uppercase; line-height:1; margin-bottom:36px; }

        /* Empty / signin card */
        .pd-empty-card { border:1.5px dashed var(--border); border-radius:8px; padding:48px 24px; text-align:center; }
        .pd-signin-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 28px; border-radius:6px; border:1.5px solid var(--ink); background:transparent; color:var(--ink); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:background .2s, color .2s; text-decoration:none; }
        .pd-signin-btn:hover { background:var(--ink); color:#fff; }
      `}</style>

      <div className="pd-wrap">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>

          {/* ── NAV / BREADCRUMB ─────────────────────────────── */}
          <div style={{ paddingTop: 96, paddingBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <Link href="/products" className="pd-back">
              <span className="pd-back-icon"><ArrowLeft size={16} /></span>
              Back
            </Link>
            <div className="pd-breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={12} />
              <Link href="/products">Products</Link>
              {product.category?.name && (<><ChevronRight size={12} /><span>{product.category.name}</span></>)}
              <ChevronRight size={12} />
              <span style={{ color: "var(--ink)", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</span>
            </div>
          </div>

          {/* ── MAIN GRID ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>

            {/* Gallery column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="pd-gallery-main">
                {discountPct > 0 && <span className="pd-badge">−{discountPct}%</span>}
                {product.stock < 5 && product.stock > 0 && <span className="pd-stock-badge">Only {product.stock} left</span>}
                <AnimatePresence mode="wait">
                  <motion.div key={activeImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4 }} style={{ position: "absolute", inset: 0 }}>
                    <Image src={product.gallery[activeImage]} alt={product.title} fill unoptimized className="object-cover" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnails */}
              {product.gallery.length > 1 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {product.gallery.map((img, idx) => (
                    <button key={idx} className={`pd-thumb ${idx === activeImage ? "active" : "inactive"}`} onClick={() => setActiveImage(idx)}>
                      <Image src={img} alt="" fill unoptimized className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 8 }}>

              {/* Category + title */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {product.category?.name && <span className="pd-category-tag">{product.category.name}</span>}
                <h1 className="pd-title">{product.title}</h1>
              </div>

              {/* Price + rating */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--mid)", display: "block", marginBottom: 6 }}>Price</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <span className="pd-price">${displayPrice.toFixed(2)}</span>
                    {originalPrice && <span className="pd-price-orig">${originalPrice.toFixed(2)}</span>}
                  </div>
                </div>
                {reviews.length > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 2, justifyContent: "flex-end", marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} className={i <= Math.round(avgRating) ? "pd-star" : "pd-star empty"} fill={i <= Math.round(avgRating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>{avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="pd-desc-box">
                <span className="pd-desc-label">About this product</span>
                <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "rgba(10,10,10,.7)" }}>{product.description}</p>
              </div>

              {/* Sizes */}
              {sizes.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mid)" }}>Size</span>
                    <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>Select one</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {sizes.map((size) => (
                      <button key={size} className={`pd-size-btn ${selectedVariant?.size === size ? "active" : "inactive"}`}
                        onClick={() => { const match = product.variants?.find((v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)); setSelectedVariant(match ?? product.variants?.find((v) => v.size === size) ?? null); }}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mid)", display: "block", marginBottom: 10 }}>Color</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {colors.map((color) => (
                      <button key={color} className={`pd-color-btn ${selectedVariant?.color === color ? "active" : "inactive"}`}
                        onClick={() => { const match = product.variants?.find((v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size)); setSelectedVariant(match ?? product.variants?.find((v) => v.color === color) ?? null); }}>
                        <span className="pd-color-swatch" style={{ backgroundColor: color.toLowerCase() }} />
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to bag */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="pd-qty">
                  <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button>
                  <span className="pd-qty-val">{quantity}</span>
                  <button className="pd-qty-btn" onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}><Plus size={15} /></button>
                </div>
                <button className="pd-add-btn" onClick={handleAddToCart} disabled={effectiveStock === 0}>
                  {effectiveStock === 0 ? "Out of Stock" : <><ShoppingBag size={17} /> Add to Bag</>}
                </button>
                <button className={`pd-wish-btn ${wishlisted ? "wishlisted" : ""}`} onClick={handleToggleWishlist} disabled={wishlistLoading} aria-label="Wishlist">
                  <Heart size={19} fill={wishlisted ? "#e11d48" : "none"} />
                </button>
              </div>

              {/* Trust strip */}
              <div className="pd-trust">
                <div className="pd-trust-item">
                  <div className="pd-trust-icon" style={{ background: "rgba(200,255,0,.15)" }}><Truck size={18} style={{ color: "#5a6e00" }} /></div>
                  <div>
                    <p className="pd-trust-label">Free Shipping</p>
                    <p className="pd-trust-desc">On orders over $50. Tracked every step.</p>
                  </div>
                </div>
                <div className="pd-trust-item">
                  <div className="pd-trust-icon" style={{ background: "rgba(10,10,10,.05)" }}><ShieldCheck size={18} style={{ color: "var(--ink)" }} /></div>
                  <div>
                    <p className="pd-trust-label">Secure Checkout</p>
                    <p className="pd-trust-desc">End-to-end encrypted payments.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── REVIEWS ──────────────────────────────────────── */}
          <section style={{ marginTop: 96, paddingBottom: 96 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40 }}>
              <div>
                <span className="pd-section-tag">Customer Reviews</span>
                <h2 className="pd-section-head" style={{ marginBottom: 0 }}>What People Say</h2>
              </div>
              {reviews.length > 0 && (
                <div style={{ display: "flex", gap: 40 }}>
                  {[{ val: avgRating.toFixed(1), label: "Avg Rating" }, { val: reviews.length, label: "Reviews" }].map(({ val, label }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <p className="font-display" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mid)", marginTop: 6 }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }} className="lg:grid-cols-[1fr_380px]">

              {/* Review list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.length === 0 ? (
                  <div className="pd-empty-card">
                    <Star size={32} style={{ color: "var(--mid)", margin: "0 auto 16px" }} />
                    <p className="font-display" style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>No Reviews Yet</p>
                    <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300 }}>Be the first to share your experience.</p>
                  </div>
                ) : reviews.map((review) => (
                  <motion.div key={review.id} className="pd-review-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5 }}>
                    <div>
                      <div className="pd-review-avatar">{review.user.name?.charAt(0).toUpperCase() || "U"}</div>
                      <p style={{ fontSize: 11, fontWeight: 500, textAlign: "center", marginTop: 8 }}>{review.user.name || "Anonymous"}</p>
                      <p style={{ fontSize: 10, color: "var(--mid)", textAlign: "center", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 2 }}>Verified</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} className={i <= review.rating ? "pd-star" : "pd-star empty"} />)}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "rgba(10,10,10,.7)" }}>{review.comment}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Review form / sign-in prompt */}
              <div>
                {isAuthenticated && !reviews.some((r) => r.user.id === user?.id) ? (
                  <div className="pd-review-form">
                    <p className="font-display" style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>Leave a Review</p>
                    <p style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 24 }}>Share your experience to help other shoppers.</p>
                    <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mid)", display: "block", marginBottom: 10 }}>Your Rating</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" className={`pd-star-btn ${star <= userRating ? "on" : "off"}`} onClick={() => setUserRating(star)}>
                              <Star size={16} fill={star <= userRating ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mid)", display: "block", marginBottom: 10 }}>Comment</span>
                        <textarea className="pd-textarea" value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="Fit, quality, overall experience…" />
                      </div>
                      <button type="submit" className="pd-submit-btn" disabled={isSubmittingReview}>
                        {isSubmittingReview ? "Submitting…" : <><Send size={14} /> Submit Review</>}
                      </button>
                    </form>
                  </div>
                ) : !isAuthenticated && (
                  <div className="pd-review-form pd-empty-card" style={{ position: "sticky", top: 84 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(10,10,10,.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                      <Zap size={24} style={{ color: "var(--mid)" }} />
                    </div>
                    <p className="font-display" style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>Sign In to Review</p>
                    <p style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 24 }}>Log in to share how this product worked for you.</p>
                    <Link href="/auth/login" className="pd-signin-btn">Sign In</Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── RELATED PRODUCTS ─────────────────────────────── */}
          {relatedProducts.length > 0 && (
            <section style={{ paddingBottom: 96 }}>
              <span className="pd-section-tag">You May Also Like</span>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
                <h2 className="pd-section-head" style={{ marginBottom: 0 }}>Similar Products</h2>
                <Link href="/products" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--mid)", textDecoration: "none" }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }} className="sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={{ id: p.id, title: p.title, description: p.description, price: p.price, discounted: p.discounted, image: p.gallery?.[0] || FALLBACK }} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}