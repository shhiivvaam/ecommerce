"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductGrid } from "@/components/home/ProductGrid";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { ValueProps } from "@/components/home/ValueProps";
import { JoinCTA } from "@/components/home/JoinCTA";

export default function Home() {
  const router = useRouter();

  // Single-product store mode: redirect if the store is configured for one product
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings").catch(() => ({ data: null }));
        if (res.data?.storeMode === "single" && res.data?.singleProductId) {
          router.push(`/products/${res.data.singleProductId}`);
        }
      } catch {
        // Silently ignore — settings are optional
      }
    };
    fetchSettings();
  }, [router]);

  return (
    <div className="font-body" style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <HeroSection />

      {/* Marquee Strip */}
      <div className="overflow-hidden py-4" style={{ background: "var(--accent)" }}>
        <div className="marquee-inner">
          {Array.from({ length: 8 }, (_, i) => `marquee-${i}`).map((key) => (
            <span key={key} className="font-display text-sm uppercase tracking-widest whitespace-nowrap px-10"
              style={{ color: "var(--ink)", fontWeight: 700, letterSpacing: ".2em" }}>
              New Arrivals&nbsp;·&nbsp; Free Shipping Over $50 &nbsp;·&nbsp; Easy Returns &nbsp;·&nbsp; Members Get Early Access &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      <CategoryGrid />
      <div className="divider mx-6 md:mx-12 lg:mx-20" />
      <ProductGrid />
      <EditorialBanner />
      <ValueProps />
      <JoinCTA />
    </div>
  );
}