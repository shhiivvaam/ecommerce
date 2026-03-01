"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import {
  ShoppingBag, Star, ShieldCheck, Truck, ArrowLeft, Send,
  Heart, ChevronRight, Zap, Plus, Minus, RefreshCw,
} from "lucide-react";
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

const FALLBACK =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
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
  const [mobileTab, setMobileTab] = useState<"details" | "reviews">("details");

  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, user } = useAuthStore();

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${params.id}/reviews`);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
    } catch (err) {
      console.error("Reviews fetch failed", err);
    }
  }, [params.id]);

  const { data: productsData, isLoading } = useQuery<{
    products?: ExternalProduct[];
  }>({
    queryKey: ["product-detail", params.id],
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const product: Product | null = useMemo(() => {
    if (!productsData?.products) return null;
    const raw = productsData.products.find((p) => p.id === params.id);
    if (!raw) return null;
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      price: raw.price,
      discounted: raw.discounted ?? undefined,
      image: raw.gallery?.[0] || FALLBACK,
      gallery: raw.gallery?.length ? raw.gallery : [FALLBACK],
      stock: raw.stock ?? 0,
      category: raw.category ?? undefined,
      variants: raw.variants ?? [],
    };
  }, [productsData, params.id]);

  const relatedProducts: RelatedProduct[] = useMemo(() => {
    if (!productsData?.products || !product?.category?.id) return [];
    return productsData.products
      .filter(
        (p) =>
          p.id !== product.id && p.category?.id === product.category!.id
      )
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        discounted: p.discounted ?? undefined,
        gallery: p.gallery || [],
      }));
  }, [productsData, product]);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      api
        .get(`/wishlist/${params.id}/check`)
        .then(({ data }) => setWishlisted(data.inWishlist))
        .catch(() => {});
    }
  }, [params.id, isAuthenticated, fetchReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    const base = product.discounted ?? product.price;
    const price = base + (selectedVariant?.priceDiff ?? 0);
    addItem({
      productId: product.id,
      title:
        product.title +
        (selectedVariant
          ? ` (${[selectedVariant.size, selectedVariant.color]
              .filter(Boolean)
              .join(", ")})`
          : ""),
      price,
      quantity,
      image: product.image,
    });
    toast.success("Added to bag");
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Sign in to save favorites");
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        setWishlisted(false);
        toast.success("Removed from favorites");
      } else {
        await api.post(`/wishlist/${product.id}`);
        setWishlisted(true);
        toast.success("Saved to favorites");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.post(`/products/${params.id}/reviews`, {
        rating: userRating,
        comment: userComment,
      });
      toast.success("Review submitted");
      setUserRating(0);
      setUserComment("");
      await fetchReviews();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(msg || "Unable to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const basePrice = product?.discounted ?? product?.price ?? 0;
  const displayPrice = basePrice + (selectedVariant?.priceDiff ?? 0);
  const originalPrice = product?.discounted
    ? product.price + (selectedVariant?.priceDiff ?? 0)
    : undefined;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : product?.stock ?? 0;
  const sizes = Array.from(
    new Set(
      (product?.variants ?? [])
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s))
    )
  );
  const colors = Array.from(
    new Set(
      (product?.variants ?? [])
        .map((v) => v.color)
        .filter((c): c is string => Boolean(c))
    )
  );
  const discountPct = product?.discounted
    ? Math.round((1 - product.discounted / product.price) * 100)
    : 0;

  /* ── LOADING ─────────────────────────────────────────────── */
  if (isLoading)
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
          :root { --paper: #f5f3ef; }
          @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
        `}</style>
        <div style={{ background: "var(--paper)", minHeight: "100vh", padding: "clamp(80px,10vw,120px) clamp(16px,5vw,32px) 60px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "clamp(24px,5vw,48px)" }}>
            <div style={{ aspectRatio: "4/5", borderRadius: 12, background: "rgba(10,10,10,.07)", animation: "shimmer 1.4s ease-in-out infinite" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[80, 200, 120, 60].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 8, background: "rgba(10,10,10,.07)", animation: "shimmer 1.4s ease-in-out infinite" }} />
              ))}
            </div>
          </div>
        </div>
      </>
    );

  /* ── NOT FOUND ───────────────────────────────────────────── */
  if (!product)
    return (
      <div style={{ background: "#f5f3ef", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: "'DM Sans',sans-serif", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(40px,8vw,64px)", fontWeight: 900, textTransform: "uppercase" }}>
          Product Not Found
        </h1>
        <p style={{ color: "#8a8a8a", fontSize: 16, maxWidth: 360 }}>
          This product may have been removed or is unavailable.
        </p>
        <Link href="/products">
          <button style={{ padding: "13px 32px", borderRadius: 5, background: "#0a0a0a", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Back to Products
          </button>
        </Link>
      </div>
    );

  /* ── FULL PAGE ───────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --ink: #0a0a0a;
          --paper: #f5f3ef;
          --accent: #c8ff00;
          --mid: #8a8a8a;
          --border: rgba(10,10,10,0.1);
          --card: #ffffff;
        }

        /* ── BASE ── */
        .pd-wrap { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
        .d { font-family: 'Barlow Condensed', sans-serif; }

        /* ── NAV BAR ── */
        .pd-nav {
          padding: clamp(72px, 10vw, 96px) clamp(16px, 5vw, 32px) clamp(24px, 4vw, 40px);
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .pd-back {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--mid);
          text-decoration: none;
          transition: color 0.2s;
        }
        .pd-back:hover { color: var(--ink); }
        .pd-back-icon {
          width: 34px; height: 34px;
          border-radius: 5px;
          border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .pd-back:hover .pd-back-icon { background: var(--ink); border-color: var(--ink); color: #fff; }

        .pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--mid);
        }
        .pd-breadcrumb a { color: var(--mid); text-decoration: none; transition: color 0.2s; }
        .pd-breadcrumb a:hover { color: var(--ink); }
        .pd-breadcrumb-current {
          color: var(--ink); font-weight: 500;
          max-width: 180px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        /* Hide breadcrumb on very small screens */
        @media (max-width: 480px) { .pd-breadcrumb { display: none; } }

        /* ── MAIN GRID ── */
        .pd-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 clamp(16px, 5vw, 32px);
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(32px, 5vw, 56px);
        }
        @media (min-width: 768px) {
          .pd-main { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1100px) {
          .pd-main { grid-template-columns: 55% 1fr; }
        }

        /* ── GALLERY ── */
        .pd-gallery { display: flex; flex-direction: column; gap: 12px; }

        .pd-gallery-main {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          background: #ede9e3;
          aspect-ratio: 1 / 1;
        }
        @media (min-width: 768px) {
          .pd-gallery-main { aspect-ratio: 4 / 5; }
        }

        .pd-badge-discount {
          position: absolute; top: 14px; left: 14px; z-index: 5;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 3px;
          background: var(--accent); color: var(--ink);
        }
        .pd-badge-stock {
          position: absolute; top: 14px; right: 14px; z-index: 5;
          font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 3px;
          background: #fff3f3; color: #c00; border: 1px solid rgba(200,0,0,0.15);
        }

        /* Thumbnails */
        .pd-thumbs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .pd-thumbs::-webkit-scrollbar { display: none; }
        .pd-thumb {
          position: relative;
          width: clamp(52px, 10vw, 72px);
          aspect-ratio: 1 / 1;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 0.2s, opacity 0.2s;
          background: #ede9e3;
        }
        .pd-thumb.active { border-color: var(--ink); }
        .pd-thumb.inactive { opacity: 0.5; }
        .pd-thumb.inactive:hover { opacity: 1; }

        /* ── INFO COLUMN ── */
        .pd-info { display: flex; flex-direction: column; gap: clamp(20px, 3vw, 28px); padding-top: 4px; }

        /* Category tag */
        .pd-cat-tag {
          display: inline-flex; align-items: center;
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 3px;
          background: rgba(200,255,0,0.15); color: #4d5c00;
          border: 1px solid rgba(200,255,0,0.4);
          align-self: flex-start;
        }

        /* Title */
        .pd-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.95;
          letter-spacing: -0.01em;
        }

        /* Price row */
        .pd-price-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pd-price {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(36px, 5vw, 44px);
          font-weight: 900;
          line-height: 1;
        }
        .pd-price-orig {
          font-size: 18px; font-weight: 300; color: var(--mid); text-decoration: line-through;
        }
        .pd-rating-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .pd-star { color: var(--ink); }
        .pd-star.empty { color: rgba(10,10,10,0.12); }

        /* Description */
        .pd-desc-box {
          border: 1.5px solid var(--border);
          border-radius: 8px;
          padding: clamp(16px, 3vw, 24px);
          background: var(--card);
        }
        .pd-desc-label {
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--mid); margin-bottom: 10px; display: block;
        }

        /* Field label */
        .pd-field-label {
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--mid); display: block; margin-bottom: 10px;
        }

        /* Size buttons */
        .pd-sizes { display: flex; gap: 8px; flex-wrap: wrap; }
        .pd-size-btn {
          height: 40px; min-width: 52px; padding: 0 14px;
          border-radius: 5px; border: 1.5px solid var(--border); background: transparent;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s; white-space: nowrap;
        }
        .pd-size-btn.active { background: var(--ink); border-color: var(--ink); color: #fff; }
        .pd-size-btn.inactive { color: var(--mid); }
        .pd-size-btn.inactive:hover { border-color: var(--ink); color: var(--ink); }

        /* Color buttons */
        .pd-colors { display: flex; gap: 8px; flex-wrap: wrap; }
        .pd-color-btn {
          display: inline-flex; align-items: center; gap: 8px;
          height: 40px; padding: 0 14px 0 6px;
          border-radius: 5px; border: 1.5px solid var(--border); background: transparent;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: border-color 0.2s; flex-shrink: 0;
        }
        .pd-color-btn.active { border-color: var(--ink); background: var(--card); }
        .pd-color-btn.inactive:hover { border-color: rgba(10,10,10,0.3); }
        .pd-color-swatch {
          width: 26px; height: 26px; border-radius: 3px;
          border: 1px solid rgba(10,10,10,0.1); flex-shrink: 0;
        }

        /* Qty + CTA row */
        .pd-cta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pd-qty {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pd-qty-btn {
          width: 42px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer; color: var(--ink);
          transition: background 0.15s;
        }
        .pd-qty-btn:hover { background: rgba(10,10,10,0.05); }
        .pd-qty-val { width: 40px; text-align: center; font-size: 15px; font-weight: 500; }

        .pd-add-btn {
          flex: 1; min-width: 160px; height: 48px; border-radius: 5px; border: none;
          background: var(--ink); color: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 0.2s, transform 0.15s;
        }
        .pd-add-btn:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); }
        .pd-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pd-wish-btn {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: 5px; border: 1.5px solid var(--border); background: transparent;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--mid); transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .pd-wish-btn:hover { border-color: #e11d48; color: #e11d48; }
        .pd-wish-btn.wishlisted { border-color: #e11d48; color: #e11d48; background: #fff0f3; }

        /* Trust grid */
        .pd-trust {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .pd-trust-item {
          background: var(--card); padding: 18px;
          display: flex; align-items: flex-start; gap: 12;
        }
        .pd-trust-icon {
          width: 34px; height: 34px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pd-trust-label { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
        .pd-trust-desc { font-size: 11px; color: var(--mid); font-weight: 300; line-height: 1.5; }

        /* ── MOBILE TABS (for reviews) ── */
        .pd-tabs {
          display: flex;
          gap: 0;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          margin: 40px clamp(16px,5vw,32px) 0;
        }
        @media (min-width: 768px) { .pd-tabs { display: none; } }
        .pd-tab {
          flex: 1; height: 44px;
          background: transparent; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid);
          transition: background 0.2s, color 0.2s;
        }
        .pd-tab.active { background: var(--ink); color: #fff; }
        .pd-tab + .pd-tab { border-left: 1.5px solid var(--border); }

        /* ── REVIEWS SECTION ── */
        .pd-reviews-section {
          max-width: 1400px;
          margin: clamp(56px,8vw,96px) auto 0;
          padding: 0 clamp(16px,5vw,32px) clamp(56px,8vw,96px);
        }
        /* Hide on mobile if tab is "details" */
        @media (max-width: 767px) {
          .pd-reviews-section { display: none; }
          .pd-reviews-section.visible { display: block; }
        }

        .pd-reviews-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 900px) {
          .pd-reviews-grid { grid-template-columns: 1fr 360px; align-items: start; }
        }

        /* Review card */
        .pd-review-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: clamp(20px,3vw,28px);
          display: flex; gap: clamp(14px,2vw,20px);
        }
        @media (max-width: 480px) {
          .pd-review-card { flex-direction: column; gap: 12px; }
        }
        .pd-review-avatar {
          width: 44px; height: 44px; border-radius: 6px;
          background: var(--paper); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 18px; flex-shrink: 0;
        }

        /* Review form */
        .pd-review-form {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: clamp(20px,3vw,28px);
          position: sticky; top: 84px;
        }
        @media (max-width: 899px) { .pd-review-form { position: static; } }

        .pd-star-btn {
          width: 38px; height: 38px; border-radius: 5px;
          border: 1.5px solid var(--border); background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .pd-star-btn.on { background: var(--ink); border-color: var(--ink); color: #fff; }
        .pd-star-btn.off { color: rgba(10,10,10,0.25); }
        .pd-star-btn.off:hover { border-color: var(--ink); }

        .pd-textarea {
          width: 100%; min-height: 130px;
          border: 1.5px solid var(--border); border-radius: 6px; padding: 14px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300;
          color: var(--ink); background: var(--paper); resize: none; outline: none;
          transition: border-color 0.2s;
        }
        .pd-textarea:focus { border-color: var(--ink); }
        .pd-textarea::placeholder { color: rgba(10,10,10,0.3); }

        .pd-submit-btn {
          width: 100%; height: 48px; border-radius: 5px; border: none;
          background: var(--ink); color: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 0.2s;
        }
        .pd-submit-btn:hover:not(:disabled) { background: #1a1a1a; }
        .pd-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── SECTION HEADING ── */
        .pd-section-tag {
          font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--mid); display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
        }
        .pd-section-tag::before {
          content: ''; width: 16px; height: 1.5px;
          background: var(--accent); display: inline-block;
        }
        .pd-section-head {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 900; text-transform: uppercase; line-height: 1; margin-bottom: 36px;
        }

        /* ── RELATED GRID ── */
        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(12px, 2vw, 20px);
        }
        @media (min-width: 768px) {
          .pd-related-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* ── EMPTY / SIGN-IN ── */
        .pd-empty-card {
          border: 1.5px dashed var(--border); border-radius: 8px;
          padding: clamp(32px,5vw,48px) 24px; text-align: center;
        }
        .pd-signin-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: 5px; border: 1.5px solid var(--ink);
          background: transparent; color: var(--ink);
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, color 0.2s; text-decoration: none;
        }
        .pd-signin-btn:hover { background: var(--ink); color: #fff; }

        /* ── STICKY MOBILE CTA BAR ── */
        .pd-mobile-cta {
          display: none;
        }
        @media (max-width: 767px) {
          .pd-mobile-cta {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 50;
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            background: var(--paper);
            border-top: 1px solid var(--border);
            gap: 10px;
            box-shadow: 0 -8px 32px rgba(10,10,10,0.08);
          }
          /* Add bottom padding so content isn't hidden behind sticky bar */
          .pd-wrap { padding-bottom: 88px; }
        }

        /* ── SHIMMER ── */
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      <div className="pd-wrap">

        {/* ── BREADCRUMB / BACK ─────────────────────────────── */}
        <div className="pd-nav">
          <Link href="/products" className="pd-back">
            <span className="pd-back-icon">
              <ArrowLeft size={15} strokeWidth={1.75} />
            </span>
            Back
          </Link>
          <nav className="pd-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={11} />
            <Link href="/products">Products</Link>
            {product.category?.name && (
              <>
                <ChevronRight size={11} />
                <span>{product.category.name}</span>
              </>
            )}
            <ChevronRight size={11} />
            <span className="pd-breadcrumb-current">{product.title}</span>
          </nav>
        </div>

        {/* ── MAIN PRODUCT GRID ────────────────────────────── */}
        <div className="pd-main">

          {/* ── GALLERY ── */}
          <div className="pd-gallery">
            <div className="pd-gallery-main">
              {discountPct > 0 && (
                <span className="pd-badge-discount">−{discountPct}%</span>
              )}
              {product.stock < 5 && product.stock > 0 && (
                <span className="pd-badge-stock">Only {product.stock} left</span>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image
                    src={product.gallery[activeImage]}
                    alt={product.title}
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {product.gallery.length > 1 && (
              <div className="pd-thumbs">
                {product.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    className={`pd-thumb ${idx === activeImage ? "active" : "inactive"}`}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image src={img} alt="" fill unoptimized style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── INFO ── */}
          <div className="pd-info">

            {/* Category + title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {product.category?.name && (
                <span className="pd-cat-tag">{product.category.name}</span>
              )}
              <h1 className="pd-title d">{product.title}</h1>
            </div>

            {/* Price + rating */}
            <div className="pd-price-row">
              <div>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--mid)", display: "block", marginBottom: 6 }}>
                  Price
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span className="pd-price d">${displayPrice.toFixed(2)}</span>
                  {originalPrice && (
                    <span className="pd-price-orig">${originalPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
              {reviews.length > 0 && (
                <div className="pd-rating-wrap">
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i <= Math.round(avgRating) ? "pd-star" : "pd-star empty"}
                        fill={i <= Math.round(avgRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>
                    {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pd-desc-box">
              <span className="pd-desc-label">About this product</span>
              <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: "rgba(10,10,10,0.7)" }}>
                {product.description}
              </p>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span className="pd-field-label" style={{ marginBottom: 0 }}>Size</span>
                  <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>
                    {selectedVariant?.size ? selectedVariant.size : "Select one"}
                  </span>
                </div>
                <div className="pd-sizes">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`pd-size-btn ${selectedVariant?.size === size ? "active" : "inactive"}`}
                      onClick={() => {
                        const match = product.variants?.find(
                          (v) =>
                            v.size === size &&
                            (!selectedVariant?.color || v.color === selectedVariant.color)
                        );
                        setSelectedVariant(
                          match ?? product.variants?.find((v) => v.size === size) ?? null
                        );
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <span className="pd-field-label">Color</span>
                <div className="pd-colors">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`pd-color-btn ${selectedVariant?.color === color ? "active" : "inactive"}`}
                      onClick={() => {
                        const match = product.variants?.find(
                          (v) =>
                            v.color === color &&
                            (!selectedVariant?.size || v.size === selectedVariant.size)
                        );
                        setSelectedVariant(
                          match ?? product.variants?.find((v) => v.color === color) ?? null
                        );
                      }}
                    >
                      <span
                        className="pd-color-swatch"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + CTA — hidden on mobile (shown in sticky bar instead) */}
            <div className="pd-cta-row" style={{ display: "none" }} aria-hidden="true" id="pd-desktop-cta-placeholder" />
            <div className="pd-cta-row" style={{}}>
              <div className="pd-qty">
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} strokeWidth={2} />
                </button>
                <span className="pd-qty-val">{quantity}</span>
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>
              <button
                className="pd-add-btn"
                onClick={handleAddToCart}
                disabled={effectiveStock === 0}
              >
                {effectiveStock === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingBag size={16} strokeWidth={1.5} />
                    Add to Bag
                  </>
                )}
              </button>
              <button
                className={`pd-wish-btn ${wishlisted ? "wishlisted" : ""}`}
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} strokeWidth={1.5} fill={wishlisted ? "#e11d48" : "none"} />
              </button>
            </div>

            {/* Trust strip */}
            <div className="pd-trust">
              <div className="pd-trust-item" style={{ gap: 12 }}>
                <div className="pd-trust-icon" style={{ background: "rgba(200,255,0,0.12)" }}>
                  <Truck size={16} color="#4d5c00" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="pd-trust-label">Free Shipping</p>
                  <p className="pd-trust-desc">On orders over $50.</p>
                </div>
              </div>
              <div className="pd-trust-item" style={{ gap: 12 }}>
                <div className="pd-trust-icon" style={{ background: "rgba(10,10,10,0.05)" }}>
                  <ShieldCheck size={16} color="var(--ink)" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="pd-trust-label">Secure Checkout</p>
                  <p className="pd-trust-desc">End-to-end encrypted.</p>
                </div>
              </div>
              <div className="pd-trust-item" style={{ gap: 12 }}>
                <div className="pd-trust-icon" style={{ background: "rgba(10,10,10,0.05)" }}>
                  <RefreshCw size={16} color="var(--ink)" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="pd-trust-label">30-Day Returns</p>
                  <p className="pd-trust-desc">No questions asked.</p>
                </div>
              </div>
              <div className="pd-trust-item" style={{ gap: 12 }}>
                <div className="pd-trust-icon" style={{ background: "rgba(200,255,0,0.12)" }}>
                  <Zap size={16} color="#4d5c00" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="pd-trust-label">Fast Dispatch</p>
                  <p className="pd-trust-desc">Ships within 24 hours.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── MOBILE TABS ─────────────────────────────────── */}
        <div className="pd-tabs">
          <button
            className={`pd-tab ${mobileTab === "details" ? "active" : ""}`}
            onClick={() => setMobileTab("details")}
          >
            Details
          </button>
          <button
            className={`pd-tab ${mobileTab === "reviews" ? "active" : ""}`}
            onClick={() => setMobileTab("reviews")}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* ── REVIEWS SECTION ─────────────────────────────── */}
        <section
          className={`pd-reviews-section ${mobileTab === "reviews" ? "visible" : ""}`}
          aria-label="Customer reviews"
        >
          {/* Section heading */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40 }}>
            <div>
              <p className="pd-section-tag">Customer Reviews</p>
              <h2 className="pd-section-head">What People Say</h2>
            </div>
            {reviews.length > 0 && (
              <div style={{ display: "flex", gap: clamp(24, 32) }}>
                {[
                  { val: avgRating.toFixed(1), label: "Avg Rating" },
                  { val: reviews.length, label: "Reviews" },
                ].map(({ val, label }) => (
                  <div key={label} style={{ textAlign: "right" }}>
                    <p className="d" style={{ fontSize: "clamp(40px,6vw,56px)", fontWeight: 900, lineHeight: 1 }}>{val}</p>
                    <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--mid)", marginTop: 6 }}>{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pd-reviews-grid">
            {/* Review list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.length === 0 ? (
                <div className="pd-empty-card">
                  <Star size={28} style={{ color: "var(--mid)", margin: "0 auto 16px" }} strokeWidth={1} />
                  <p className="d" style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
                    No Reviews Yet
                  </p>
                  <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300 }}>
                    Be the first to share your experience.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    className="pd-review-card"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div className="pd-review-avatar">
                        {review.user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 500 }}>{review.user.name || "Anonymous"}</p>
                      <span style={{ fontSize: 9, color: "var(--mid)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Verified</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i <= review.rating ? "currentColor" : "none"}
                              className={i <= review.rating ? "pd-star" : "pd-star empty"}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--mid)", fontWeight: 300 }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: "rgba(10,10,10,0.7)" }}>
                        {review.comment}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Review form / sign-in */}
            <div>
              {isAuthenticated && !reviews.some((r) => r.user.id === user?.id) ? (
                <div className="pd-review-form">
                  <p className="d" style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
                    Leave a Review
                  </p>
                  <p style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 24 }}>
                    Share your experience to help other shoppers.
                  </p>
                  <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <span className="pd-field-label">Your Rating</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`pd-star-btn ${star <= userRating ? "on" : "off"}`}
                            onClick={() => setUserRating(star)}
                            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                          >
                            <Star size={15} fill={star <= userRating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="pd-field-label">Comment</span>
                      <textarea
                        className="pd-textarea"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="Fit, quality, overall experience…"
                      />
                    </div>
                    <button type="submit" className="pd-submit-btn" disabled={isSubmittingReview}>
                      {isSubmittingReview ? (
                        "Submitting…"
                      ) : (
                        <>
                          <Send size={14} /> Submit Review
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : !isAuthenticated ? (
                <div className="pd-review-form pd-empty-card">
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(10,10,10,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Zap size={22} style={{ color: "var(--mid)" }} strokeWidth={1.5} />
                  </div>
                  <p className="d" style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
                    Sign In to Review
                  </p>
                  <p style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 24 }}>
                    Log in to share how this product worked for you.
                  </p>
                  <Link href="/auth/login" className="pd-signin-btn">
                    Sign In
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── RELATED PRODUCTS ─────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section style={{ maxWidth: 1400, margin: "0 auto", padding: `0 clamp(16px,5vw,32px) clamp(56px,8vw,96px)` }}>
            <p className="pd-section-tag">You May Also Like</p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <h2 className="pd-section-head" style={{ marginBottom: 0 }}>
                Similar Products
              </h2>
              <Link
                href="/products"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--mid)", textDecoration: "none" }}
              >
                View All <ChevronRight size={13} />
              </Link>
            </div>
            <div className="pd-related-grid">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    discounted: p.discounted,
                    image: p.gallery?.[0] || FALLBACK,
                  }}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── STICKY MOBILE CTA BAR ────────────────────────── */}
      <div className="pd-mobile-cta">
        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
          <button
            style={{ width: 42, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--ink)" }}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
          >
            <Minus size={13} strokeWidth={2} />
          </button>
          <span style={{ width: 36, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{quantity}</span>
          <button
            style={{ width: 42, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--ink)" }}
            onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
            aria-label="Increase quantity"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>
        <button
          style={{ flex: 1, height: 44, borderRadius: 5, border: "none", background: "var(--ink)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
          onClick={handleAddToCart}
          disabled={effectiveStock === 0}
        >
          <ShoppingBag size={15} strokeWidth={1.5} />
          {effectiveStock === 0 ? "Out of Stock" : "Add to Bag"}
        </button>
        <button
          style={{ width: 44, height: 44, borderRadius: 5, border: "1.5px solid var(--border)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: wishlisted ? "#e11d48" : "var(--mid)" }}
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          aria-label="Wishlist"
        >
          <Heart size={17} strokeWidth={1.5} fill={wishlisted ? "#e11d48" : "none"} />
        </button>
      </div>
    </>
  );
}

// tiny helper (CSS clamp isn't valid in JS template literals for gap)
function clamp(a: number, b: number) { return `${b}px`; }