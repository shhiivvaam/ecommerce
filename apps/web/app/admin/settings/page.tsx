"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
    Save, RefreshCw, LayoutGrid, Target, DollarSign,
    Percent, Globe, Zap, Shield, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Reyva Design Tokens ─────────────────────────────────────────────────────
// --ink:    #0a0a0a
// --paper:  #f5f3ef
// --accent: #c8ff00
// --mid:    #8a8a8a
// --border: rgba(10,10,10,0.1)
// Fonts: Barlow Condensed 900 (display), DM Sans 300/400/500 (body)
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        storeName: "",
        storeMode: "multi",
        singleProductId: "",
        taxRate: 0,
        shippingRate: 0,
        currency: "USD",
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/settings");
            setForm({
                storeName: data.storeName ?? "",
                storeMode: data.storeMode ?? "multi",
                singleProductId: data.singleProductId ?? "",
                taxRate: data.taxRate ?? 0,
                shippingRate: data.shippingRate ?? 0,
                currency: data.currency ?? "USD",
            });
        } catch {
            toast.error("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                storeName: form.storeName || undefined,
                storeMode: form.storeMode,
                taxRate: form.taxRate,
                shippingRate: form.shippingRate,
                currency: form.currency,
            };
            if (form.storeMode === "single" && form.singleProductId) {
                payload.singleProductId = form.singleProductId;
            }
            await api.patch("/settings", payload);
            toast.success("Settings saved.");
        } catch {
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    // ── Shared field styles ──────────────────────────────────────────────────
    const inputCls =
        "h-14 rounded-[6px] bg-[#f5f3ef] border border-[rgba(10,10,10,0.15)] " +
        "text-[#0a0a0a] font-['DM_Sans'] font-medium text-sm px-4 " +
        "placeholder:text-[#8a8a8a] focus-visible:ring-0 focus-visible:border-[#0a0a0a] " +
        "transition-colors duration-150";

    const labelCls =
        "block text-[10px] font-['DM_Sans'] font-500 uppercase tracking-[0.18em] text-[#8a8a8a] mb-2";

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="max-w-5xl space-y-8 animate-pulse">
                <div className="h-24 bg-[rgba(10,10,10,0.05)] rounded-[8px]" />
                <div className="h-64 bg-[rgba(10,10,10,0.05)] rounded-[8px]" />
                <div className="h-64 bg-[rgba(10,10,10,0.05)] rounded-[8px]" />
            </div>
        );
    }

    return (
        <>
            {/* Google Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=DM+Sans:wght@300;400;500&display=swap');
                * { font-family: 'DM Sans', sans-serif; }
            `}</style>

            <div
                className="pb-24 max-w-5xl"
                style={{ backgroundColor: "#f5f3ef", minHeight: "100vh" }}
            >
                {/* ── Page Header ──────────────────────────────────────────── */}
                <div
                    className="px-10 pt-12 pb-10 mb-10 border-b"
                    style={{
                        backgroundColor: "#0a0a0a",
                        borderColor: "rgba(255,255,255,0.08)",
                        margin: "0 0 0 0",
                        padding: "48px 48px 40px",
                    }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div>
                            {/* Eyebrow tag */}
                            <div
                                className="inline-flex items-center gap-2 px-3 py-1 mb-5 text-[#0a0a0a] text-[10px] tracking-[0.22em] uppercase"
                                style={{
                                    backgroundColor: "#c8ff00",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    borderRadius: "4px",
                                }}
                            >
                                <Globe className="h-3 w-3" />
                                Store Configuration
                            </div>

                            <h1
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 900,
                                    fontSize: "clamp(48px, 7vw, 80px)",
                                    lineHeight: 0.9,
                                    letterSpacing: "-0.02em",
                                    color: "#f5f3ef",
                                    textTransform: "uppercase",
                                }}
                            >
                                Global<br />Parameters
                            </h1>

                            <p
                                className="mt-4 max-w-md"
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 300,
                                    fontSize: "14px",
                                    color: "#8a8a8a",
                                    lineHeight: 1.6,
                                }}
                            >
                                Configure store identity, operational mode, and financial settings applied globally across the platform.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={fetchSettings}
                                className="h-12 w-12 flex items-center justify-center border transition-colors duration-150"
                                style={{
                                    borderRadius: "6px",
                                    borderColor: "rgba(255,255,255,0.15)",
                                    backgroundColor: "transparent",
                                    color: "#f5f3ef",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = "#c8ff00")}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-12 px-8 flex items-center gap-2 text-[#0a0a0a] text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-150 disabled:opacity-60"
                                style={{
                                    backgroundColor: "#c8ff00",
                                    borderRadius: "6px",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                                onMouseEnter={e => !saving && (e.currentTarget.style.backgroundColor = "#d4ff33")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#c8ff00")}
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Content ──────────────────────────────────────────────── */}
                <div className="px-10 space-y-8">

                    {/* Section: Global Identity */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-white border"
                        style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                    >
                        {/* Section Header Bar */}
                        <div
                            className="px-8 py-5 border-b flex items-center gap-3"
                            style={{ borderColor: "rgba(10,10,10,0.08)" }}
                        >
                            <span
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    color: "#c8ff00",
                                    backgroundColor: "#0a0a0a",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                }}
                            >
                                01
                            </span>
                            <h2
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 900,
                                    fontSize: "20px",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    color: "#0a0a0a",
                                }}
                            >
                                Store Identity
                            </h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>Store Name</label>
                                <Input
                                    value={form.storeName}
                                    onChange={e => setForm({ ...form, storeName: e.target.value })}
                                    placeholder="e.g. REYVA"
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Settlement Currency</label>
                                <div className="relative">
                                    <select
                                        value={form.currency}
                                        onChange={e => setForm({ ...form, currency: e.target.value })}
                                        className="w-full h-14 pl-4 pr-10 border text-[#0a0a0a] text-sm font-medium appearance-none focus:outline-none focus:border-[#0a0a0a] transition-colors duration-150"
                                        style={{
                                            borderRadius: "6px",
                                            backgroundColor: "#f5f3ef",
                                            borderColor: "rgba(10,10,10,0.15)",
                                            fontFamily: "'DM Sans', sans-serif",
                                        }}
                                    >
                                        <option value="USD">USD — US Dollar ($)</option>
                                        <option value="EUR">EUR — Euro (€)</option>
                                        <option value="GBP">GBP — British Pound (£)</option>
                                        <option value="INR">INR — Indian Rupee (₹)</option>
                                    </select>
                                    <ChevronDown
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                                        style={{ color: "#8a8a8a" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Section: Operational Mode */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
                        className="bg-white border"
                        style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                    >
                        <div
                            className="px-8 py-5 border-b flex items-center gap-3"
                            style={{ borderColor: "rgba(10,10,10,0.08)" }}
                        >
                            <span
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    color: "#c8ff00",
                                    backgroundColor: "#0a0a0a",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                }}
                            >
                                02
                            </span>
                            <h2
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 900,
                                    fontSize: "20px",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    color: "#0a0a0a",
                                }}
                            >
                                Operational Mode
                            </h2>
                        </div>

                        <div className="p-8">
                            <p
                                className="mb-6 text-sm"
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 300,
                                    color: "#8a8a8a",
                                    lineHeight: 1.6,
                                }}
                            >
                                Choose how the storefront is presented. Multi-Catalog enables full product browsing; Single-Asset redirects all traffic to one focused product page.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        id: "multi",
                                        label: "Multi-Catalog",
                                        desc: "Full browseable product catalog",
                                        icon: LayoutGrid,
                                    },
                                    {
                                        id: "single",
                                        label: "Single-Asset",
                                        desc: "Focused single-product landing",
                                        icon: Target,
                                    },
                                ].map(mode => {
                                    const active = form.storeMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setForm({ ...form, storeMode: mode.id })}
                                            className="relative p-6 text-left border transition-all duration-150"
                                            style={{
                                                borderRadius: "8px",
                                                borderColor: active ? "#0a0a0a" : "rgba(10,10,10,0.1)",
                                                backgroundColor: active ? "#0a0a0a" : "#f5f3ef",
                                            }}
                                        >
                                            {active && (
                                                <span
                                                    className="absolute top-4 right-4 text-[10px] font-medium uppercase tracking-[0.18em] px-2 py-0.5"
                                                    style={{
                                                        backgroundColor: "#c8ff00",
                                                        color: "#0a0a0a",
                                                        borderRadius: "4px",
                                                        fontFamily: "'DM Sans', sans-serif",
                                                    }}
                                                >
                                                    Active
                                                </span>
                                            )}
                                            <mode.icon
                                                className="h-6 w-6 mb-4"
                                                style={{ color: active ? "#c8ff00" : "#8a8a8a" }}
                                            />
                                            <p
                                                style={{
                                                    fontFamily: "'Barlow Condensed', sans-serif",
                                                    fontWeight: 900,
                                                    fontSize: "22px",
                                                    letterSpacing: "0.02em",
                                                    textTransform: "uppercase",
                                                    color: active ? "#f5f3ef" : "#0a0a0a",
                                                }}
                                            >
                                                {mode.label}
                                            </p>
                                            <p
                                                className="mt-1 text-xs"
                                                style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontWeight: 400,
                                                    color: active ? "#8a8a8a" : "#8a8a8a",
                                                }}
                                            >
                                                {mode.desc}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Single Product ID Field */}
                            <AnimatePresence>
                                {form.storeMode === "single" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div
                                            className="mt-6 pt-6 border-t"
                                            style={{ borderColor: "rgba(10,10,10,0.08)" }}
                                        >
                                            <label className={labelCls}>
                                                Target Product ID
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    value={form.singleProductId}
                                                    onChange={e => setForm({ ...form, singleProductId: e.target.value })}
                                                    placeholder="Paste product ID..."
                                                    className={inputCls + " pr-32"}
                                                />
                                                <span
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] px-2.5 py-1"
                                                    style={{
                                                        backgroundColor: "#0a0a0a",
                                                        color: "#c8ff00",
                                                        borderRadius: "4px",
                                                        fontFamily: "'DM Sans', sans-serif",
                                                    }}
                                                >
                                                    <Zap className="h-3 w-3" />
                                                    Active
                                                </span>
                                            </div>
                                            <p
                                                className="mt-2 text-xs"
                                                style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontWeight: 300,
                                                    color: "#8a8a8a",
                                                }}
                                            >
                                                All homepage traffic will redirect to this product.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>

                    {/* Section: Economic Metrics */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
                        className="bg-white border"
                        style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                    >
                        <div
                            className="px-8 py-5 border-b flex items-center gap-3"
                            style={{ borderColor: "rgba(10,10,10,0.08)" }}
                        >
                            <span
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    color: "#c8ff00",
                                    backgroundColor: "#0a0a0a",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                }}
                            >
                                03
                            </span>
                            <h2
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 900,
                                    fontSize: "20px",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    color: "#0a0a0a",
                                }}
                            >
                                Economic Settings
                            </h2>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Tax Rate */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={labelCls} style={{ marginBottom: 0 }}>Sales Tax Rate</label>
                                        <span
                                            style={{
                                                fontFamily: "'Barlow Condensed', sans-serif",
                                                fontWeight: 900,
                                                fontSize: "28px",
                                                color: "#0a0a0a",
                                                letterSpacing: "-0.01em",
                                            }}
                                        >
                                            {form.taxRate}%
                                        </span>
                                    </div>
                                    <div className="relative mt-3">
                                        <Input
                                            type="number" min={0} max={100} step={0.01}
                                            value={form.taxRate}
                                            onChange={e => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
                                            className={inputCls + " pl-10"}
                                        />
                                        <Percent
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                            style={{ color: "#8a8a8a" }}
                                        />
                                    </div>
                                    <p
                                        className="mt-2 text-xs"
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 300,
                                            color: "#8a8a8a",
                                        }}
                                    >
                                        Applied to all checkout transactions globally.
                                    </p>
                                </div>

                                {/* Shipping Rate */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={labelCls} style={{ marginBottom: 0 }}>Flat Shipping Fee</label>
                                        <span
                                            style={{
                                                fontFamily: "'Barlow Condensed', sans-serif",
                                                fontWeight: 900,
                                                fontSize: "28px",
                                                color: "#0a0a0a",
                                                letterSpacing: "-0.01em",
                                            }}
                                        >
                                            {form.currency} {form.shippingRate.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="relative mt-3">
                                        <Input
                                            type="number" min={0} step={0.01}
                                            value={form.shippingRate}
                                            onChange={e => setForm({ ...form, shippingRate: parseFloat(e.target.value) || 0 })}
                                            className={inputCls + " pl-10"}
                                        />
                                        <DollarSign
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                            style={{ color: "#8a8a8a" }}
                                        />
                                    </div>
                                    <p
                                        className="mt-2 text-xs"
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 300,
                                            color: "#8a8a8a",
                                        }}
                                    >
                                        Fixed logistics fee applied per order.
                                    </p>
                                </div>
                            </div>

                            {/* Info bar */}
                            <div
                                className="flex items-start gap-4 p-5 border"
                                style={{
                                    borderRadius: "6px",
                                    backgroundColor: "#f5f3ef",
                                    borderColor: "rgba(10,10,10,0.08)",
                                }}
                            >
                                <Shield
                                    className="h-5 w-5 mt-0.5 shrink-0"
                                    style={{ color: "#0a0a0a" }}
                                />
                                <p
                                    className="text-xs leading-relaxed"
                                    style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 400,
                                        color: "#8a8a8a",
                                    }}
                                >
                                    These values are applied automatically during checkout. Tax is calculated as a percentage of the order subtotal; shipping is a flat fee per order regardless of quantity.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Bottom Save Bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-end pt-2"
                    >
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-10 flex items-center gap-2 text-[#0a0a0a] text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-150 disabled:opacity-60"
                            style={{
                                backgroundColor: "#c8ff00",
                                borderRadius: "6px",
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Save All Changes"}
                        </button>
                    </motion.div>
                </div>
            </div>
        </>
    );
}