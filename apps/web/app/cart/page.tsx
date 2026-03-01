"use client";

import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag, Minus, Plus, ChevronLeft, ShieldCheck, Truck, Lock } from "lucide-react";

export default function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCartStore();

  const freeShippingThreshold = 50;
  const remaining = Math.max(0, freeShippingThreshold - total);
  const progressPct = Math.min(100, (total / freeShippingThreshold) * 100);

  /* ── EMPTY STATE ─────────────────────────────────────────── */
  if (items.length === 0) {
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
          }
        `}</style>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "var(--paper)",
          color: "var(--ink)",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 24px",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mid)",
            }}>
              <ShoppingBag size={32} strokeWidth={1.25} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(36px, 8vw, 56px)",
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1,
                marginBottom: 12,
              }}>
                Your Bag is Empty
              </h2>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--mid)", maxWidth: 340, lineHeight: 1.6 }}>
                Start adding items to see them here and check out when you&apos;re ready.
              </p>
            </div>
            <Link href="/products">
              <button style={{
                padding: "14px 36px",
                borderRadius: 5,
                background: "var(--ink)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "opacity 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Browse Products <ArrowRight size={15} />
              </button>
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

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
        .cp-wrap {
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
        }

        /* ── HEADER ── */
        .cp-header {
          background: var(--ink);
          padding: 72px 0 40px;
          position: relative;
          overflow: hidden;
        }
        .cp-header-noise {
          position: absolute; inset: 0; opacity: 0.035; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .cp-header-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 72px 72px;
        }
        .cp-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 clamp(16px, 5vw, 32px);
          position: relative;
          z-index: 1;
        }

        /* ── BACK LINK ── */
        .cp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          margin-bottom: 24px;
          transition: color 0.2s;
        }
        .cp-back:hover { color: #fff; }

        /* ── HEADER TITLE ── */
        .cp-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(44px, 9vw, 88px);
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.9;
          letter-spacing: -0.01em;
          color: #fff;
          margin-bottom: 28px;
        }
        .cp-title-count {
          margin-left: clamp(12px, 2vw, 20px);
          font-size: clamp(24px, 4vw, 44px);
          color: rgba(255,255,255,0.2);
          font-weight: 700;
        }

        /* ── SHIPPING BAR ── */
        .cp-ship-bar {
          padding: 16px 20px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 480px;
        }
        .cp-ship-text {
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.5);
        }
        .cp-ship-text strong { color: #fff; font-weight: 500; }
        .cp-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .cp-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── MAIN GRID ── */
        .cp-grid {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px clamp(16px, 5vw, 32px) 96px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .cp-grid {
            grid-template-columns: 1fr 400px;
            gap: 48px;
            align-items: start;
          }
        }

        /* ── ITEMS HEADER ── */
        .cp-items-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 14px;
        }
        .cp-col-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mid);
        }

        /* ── ITEM CARD ── */
        .cp-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: clamp(14px, 3vw, 20px);
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--card);
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .cp-item:hover { border-color: rgba(10,10,10,0.2); }

        .cp-item-img {
          position: relative;
          width: clamp(72px, 12vw, 90px);
          height: clamp(88px, 14vw, 108px);
          border-radius: 6px;
          overflow: hidden;
          background: #ede9e3;
          flex-shrink: 0;
        }

        .cp-item-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cp-item-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(15px, 2.5vw, 17px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--ink);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.2;
          transition: opacity 0.2s;
        }
        .cp-item-title:hover { opacity: 0.55; }

        .cp-item-meta {
          font-size: 11px;
          color: var(--mid);
          font-weight: 300;
          letter-spacing: 0.02em;
        }

        /* ── CONTROLS ── */
        .cp-item-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .cp-qty {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }
        .cp-qty-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--ink);
          transition: background 0.15s;
        }
        .cp-qty-btn:hover { background: rgba(10,10,10,0.06); }
        .cp-qty-val {
          width: 34px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        .cp-remove {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: 1.5px solid var(--border);
          background: transparent;
          cursor: pointer;
          color: rgba(10,10,10,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .cp-remove:hover {
          border-color: #e11d48;
          color: #e11d48;
          background: #fff0f3;
        }

        /* ── PRICE ── */
        .cp-item-price {
          text-align: right;
          flex-shrink: 0;
          padding-left: 4px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }
        .cp-item-total {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(18px, 3vw, 22px);
          font-weight: 900;
          white-space: nowrap;
        }
        .cp-item-unit {
          font-size: 11px;
          font-weight: 300;
          color: var(--mid);
          white-space: nowrap;
        }

        /* ── MOBILE: stack price below body ── */
        @media (max-width: 480px) {
          .cp-item { flex-wrap: wrap; }
          .cp-item-price {
            width: 100%;
            flex-direction: row;
            justify-content: flex-end;
            align-items: baseline;
            gap: 8px;
            padding: 8px 0 0;
            border-top: 1px solid var(--border);
            margin-top: 4px;
          }
          .cp-item-price .cp-item-unit::before { content: '·'; margin-right: 8px; color: var(--border); }
        }

        /* ── SUMMARY PANEL ── */
        .cp-summary {
          background: var(--ink);
          color: #fff;
          border-radius: 8px;
          padding: clamp(24px, 4vw, 32px);
          position: sticky;
          top: 88px;
        }
        /* On mobile, summary renders below items (not sticky) */
        @media (max-width: 1023px) {
          .cp-summary { position: static; }
        }

        .cp-summary-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .cp-srow {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .cp-srow:last-of-type { border-bottom: none; }
        .cp-skey { font-size: 12px; font-weight: 300; color: rgba(255,255,255,0.4); }
        .cp-sval { font-size: 14px; font-weight: 400; }
        .cp-sval.free { color: var(--accent); }
        .cp-sval.muted { color: rgba(255,255,255,0.3); font-size: 12px; font-weight: 300; }

        .cp-total-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 24px 0 24px;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 8px;
        }
        .cp-total-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          display: block;
          margin-bottom: 4px;
        }
        .cp-total-sub { font-size: 11px; font-weight: 300; color: rgba(255,255,255,0.2); }
        .cp-total-amt {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(40px, 6vw, 52px);
          font-weight: 900;
          line-height: 1;
          color: var(--accent);
        }

        /* ── CHECKOUT BUTTON ── */
        .cp-checkout {
          width: 100%;
          height: 52px;
          border-radius: 5px;
          border: none;
          background: var(--accent);
          color: var(--ink);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: opacity 0.2s, transform 0.15s;
          margin-bottom: 12px;
        }
        .cp-checkout:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── TRUST BADGES ── */
        .cp-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
        .cp-trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.03);
        }
        .cp-trust-dot {
          width: 5px; height: 5px;
          border-radius: 1px;
          background: var(--accent);
          flex-shrink: 0;
        }

        /* ── PROMO ── */
        .cp-promo {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .cp-promo-input {
          flex: 1;
          padding: 0 14px;
          height: 42px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 5px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s;
        }
        .cp-promo-input::placeholder { color: rgba(255,255,255,0.25); }
        .cp-promo-input:focus { border-color: rgba(255,255,255,0.3); }
        .cp-promo-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cp-promo-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* ── SECTION TAG ── */
        .cp-section-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 16px;
        }
        .cp-section-tag::before {
          content: '';
          width: 16px; height: 1.5px;
          background: var(--accent);
          display: inline-block;
        }

        /* ── UPSELL STRIP (tablet+) ── */
        .cp-upsell {
          display: none;
        }
        @media (min-width: 640px) {
          .cp-upsell {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--card);
            margin-bottom: 12px;
          }
        }
        .cp-upsell-icon {
          width: 36px; height: 36px;
          border-radius: 5px;
          background: rgba(200,255,0,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cp-upsell-text { flex: 1; font-size: 13px; font-weight: 300; color: var(--ink); line-height: 1.4; }
        .cp-upsell-text strong { font-weight: 500; }

        /* ── SAFE AREA BOTTOM (mobile) ── */
        @media (max-width: 1023px) {
          .cp-grid { padding-bottom: 48px; }
        }
      `}</style>

      <div className="cp-wrap">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="cp-header">
          <div className="cp-header-noise" />
          <div className="cp-header-grid" />
          <div className="cp-header-inner">

            <Link href="/products" className="cp-back">
              <ChevronLeft size={13} strokeWidth={2} /> Continue Shopping
            </Link>

            <h1 className="cp-title">
              Your Bag
              <span className="cp-title-count">{items.length}</span>
            </h1>

            <div className="cp-ship-bar">
              <p className="cp-ship-text">
                {remaining > 0
                  ? <><strong>${remaining.toFixed(2)}</strong> away from free shipping</>
                  : <strong style={{ color: "var(--accent)" }}>Free shipping unlocked 🎉</strong>
                }
              </p>
              <div className="cp-progress-track">
                <motion.div
                  className="cp-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN GRID ──────────────────────────────────────── */}
        <div className="cp-grid">

          {/* ── LEFT: ITEMS ─────────────────────────────────── */}
          <div>
            <div className="cp-items-head">
              <span className="cp-col-label">{items.length} Item{items.length !== 1 ? "s" : ""}</span>
              <span className="cp-col-label">Price</span>
            </div>

            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.22 } }}
                  className="cp-item"
                >
                  {/* Thumbnail */}
                  <div className="cp-item-img">
                    <Image
                      src={item.image ?? ""}
                      alt={item.title}
                      fill
                      unoptimized
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  {/* Body */}
                  <div className="cp-item-body">
                    <div>
                      <Link href={`/products/${item.productId}`} className="cp-item-title">
                        {item.title}
                      </Link>
                      <p className="cp-item-meta">SKU: {item.productId.slice(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="cp-item-controls">
                      {/* Qty stepper */}
                      <div className="cp-qty">
                        <button
                          className="cp-qty-btn"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} strokeWidth={2} />
                        </button>
                        <span className="cp-qty-val">{item.quantity}</span>
                        <button
                          className="cp-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        className="cp-remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="cp-item-price">
                    <p className="cp-item-total">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="cp-item-unit">${item.price.toFixed(2)} each</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Upsell nudge (hidden on mobile) */}
            <div className="cp-upsell">
              <div className="cp-upsell-icon">
                <Truck size={16} color="var(--ink)" strokeWidth={1.5} />
              </div>
              <p className="cp-upsell-text">
                {remaining > 0
                  ? <>Add <strong>${remaining.toFixed(2)} more</strong> to unlock free standard shipping on this order.</>
                  : <>You&apos;ve unlocked <strong>free shipping</strong> on this order — nice work.</>
                }
              </p>
            </div>
          </div>

          {/* ── RIGHT: SUMMARY ──────────────────────────────── */}
          <div>
            <div className="cp-summary">
              <p className="cp-section-tag">Order Summary</p>
              <h2 className="cp-summary-title">Summary</h2>

              <div className="cp-srow">
                <span className="cp-skey">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                <span className="cp-sval">${total.toFixed(2)}</span>
              </div>
              <div className="cp-srow">
                <span className="cp-skey">Shipping</span>
                <span className={`cp-sval ${total >= freeShippingThreshold ? "free" : ""}`}>
                  {total >= freeShippingThreshold ? "Free" : "Calculated at checkout"}
                </span>
              </div>
              <div className="cp-srow">
                <span className="cp-skey">Taxes</span>
                <span className="cp-sval muted">At checkout</span>
              </div>

              <div className="cp-total-row">
                <div>
                  <span className="cp-total-label">Estimated Total</span>
                  <p className="cp-total-sub">Final amount at checkout</p>
                </div>
                <span className="cp-total-amt">${total.toFixed(2)}</span>
              </div>

              <Link href="/checkout" style={{ display: "block" }}>
                <button className="cp-checkout">
                  Checkout <ArrowRight size={16} strokeWidth={2} />
                </button>
              </Link>

              <div className="cp-trust">
                <div className="cp-trust-item">
                  <span className="cp-trust-dot" />
                  <ShieldCheck size={13} strokeWidth={1.5} />
                  SSL Secure
                </div>
                <div className="cp-trust-item">
                  <span className="cp-trust-dot" />
                  <Truck size={13} strokeWidth={1.5} />
                  Fast Delivery
                </div>
                <div className="cp-trust-item">
                  <span className="cp-trust-dot" />
                  <Lock size={13} strokeWidth={1.5} />
                  Safe Checkout
                </div>
                <div className="cp-trust-item">
                  <span className="cp-trust-dot" />
                  30-Day Returns
                </div>
              </div>

              {/* Promo */}
              <div className="cp-promo">
                <input
                  className="cp-promo-input"
                  type="text"
                  placeholder="Promo code"
                  aria-label="Promo code"
                />
                <button className="cp-promo-btn">Apply</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}