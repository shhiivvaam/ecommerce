"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAddToCart } from "@/lib/hooks/useCart";
import { api } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { analytics } from "@/lib/analytics";
import { ProductErrorBoundary } from "./ErrorBoundary";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number | null;
    image?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <ProductErrorBoundary>
      <ProductCardInner product={product} />
    </ProductErrorBoundary>
  );
}

function ProductCardInner({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { mutate: addToCart, isPending } = useAddToCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const router = useRouter();

  const displayPrice = product.discounted ?? product.price;
  const hasDiscount = product.discounted && product.discounted < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - displayPrice) / product.price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }

    addToCart({
      productId: product.id,
      title: product.title,
      price: displayPrice,
      quantity: 1,
      image: product.image,
    });

    analytics.track("ADD_TO_CART", {
      productId: product.id,
      title: product.title,
      price: displayPrice,
      location: "product_card",
    });
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }

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

  return (
    <motion.div
      className="pc-root"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <Link href={`/products/${product.id}`} className="block" style={{ textDecoration: "none" }}>
        {/* Image */}
        <div className="pc-img-wrap">
          <Image
            src={product.image ?? "/placeholder-product.png"}
            alt={product.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          <div className="pc-scrim" />

          {discountPct && <span className="pc-badge">−{discountPct}%</span>}

          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`pc-wish ${wishlisted ? "wishlisted active" : ""}`}
            aria-label={wishlisted ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart size={16} fill={wishlisted ? "#e11d48" : "none"} />
          </button>

          <button className="pc-add" onClick={handleAddToCart} disabled={isPending}>
            <ShoppingBag size={14} />
            Add to Bag
          </button>
        </div>

        {/* Info */}
        <div className="pc-info">
          <p className="pc-title">{product.title}</p>
          <div className="pc-price-row">
            <span className="pc-price">₹{displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            {hasDiscount && (
              <span className="pc-price-orig">₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
