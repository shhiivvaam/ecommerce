"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    ChevronDown, RefreshCw, ShoppingBag, Clock,
    Package, X, MapPin, User, DollarSign,
    ExternalLink, Zap, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Reyva Tokens ─────────────────────────────────────────────────────────────
// ink: #0a0a0a | paper: #f5f3ef | accent: #c8ff00 | mid: #8a8a8a
// Barlow Condensed 900 (display) · DM Sans 300/400/500 (body)
// ─────────────────────────────────────────────────────────────────────────────

interface OrderItem {
    id: string;
    productTitle: string;
    price: number;
    quantity: number;
    sku?: string;
}

interface Order {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { email: string; name?: string };
    items: OrderItem[];
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
}

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// Reyva-aligned status styles: no color-coded pastels — use ink/paper/accent language
const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING:    { bg: "#fff8e1", text: "#7a5c00", dot: "#f5b800" },
    PROCESSING: { bg: "#e8f0fe", text: "#1a3e8c", dot: "#3b6ff5" },
    SHIPPED:    { bg: "#f3e8ff", text: "#5b21b6", dot: "#8b5cf6" },
    DELIVERED:  { bg: "#e6f9f0", text: "#14532d", dot: "#22c55e" },
    CANCELLED:  { bg: "#fce8e8", text: "#7f1d1d", dot: "#ef4444" },
};

const labelCls =
    "block text-[10px] font-['DM_Sans'] font-500 uppercase tracking-[0.18em] text-[#8a8a8a] mb-2";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/orders/admin/all");
            setOrders(data);
        } catch {
            toast.error("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleStatusChange = async (orderId: string, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
            toast.success("Status updated.");
        } catch {
            toast.error("Failed to update status.");
        }
    };

    const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === "PENDING").length,
        processing: orders.filter(o => o.status === "PROCESSING").length,
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const meta = STATUS_META[status] ?? { bg: "#f5f3ef", text: "#8a8a8a", dot: "#8a8a8a" };
        return (
            <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em]"
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: meta.bg,
                    color: meta.text,
                    borderRadius: "4px",
                }}
            >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                {status}
            </span>
        );
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=DM+Sans:wght@300;400;500&display=swap');
                * { font-family: 'DM Sans', sans-serif; }
                .reyva-scrollbar::-webkit-scrollbar { width: 4px; }
                .reyva-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .reyva-scrollbar::-webkit-scrollbar-thumb { background: rgba(10,10,10,0.12); border-radius: 4px; }
            `}</style>

            <div style={{ backgroundColor: "#f5f3ef", minHeight: "100vh" }}>

                {/* ── Page Header (ink) ────────────────────────────────────── */}
                <div style={{ backgroundColor: "#0a0a0a", padding: "48px 48px 40px" }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 max-w-7xl">
                        <div>
                            <div
                                className="inline-flex items-center gap-2 px-3 py-1 mb-5 text-[10px] uppercase tracking-[0.22em]"
                                style={{ backgroundColor: "#c8ff00", color: "#0a0a0a", borderRadius: "4px", fontWeight: 500 }}
                            >
                                <Activity className="h-3 w-3" />
                                Order Management
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
                                Transaction<br />Logistics
                            </h1>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "14px", color: "#8a8a8a", marginTop: "16px", lineHeight: 1.6 }}>
                                Monitor, filter, and fulfill all customer orders across the platform.
                            </p>
                        </div>

                        <button
                            onClick={fetchOrders}
                            className="h-12 px-6 flex items-center gap-2 uppercase tracking-[0.18em] text-[11px] transition-all duration-150 border"
                            style={{
                                borderRadius: "6px",
                                borderColor: "rgba(255,255,255,0.15)",
                                backgroundColor: "transparent",
                                color: "#f5f3ef",
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "#c8ff00")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="px-12 py-10 max-w-7xl space-y-8">

                    {/* ── Stat Cards ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { label: "Total Orders", value: stats.total, icon: ShoppingBag },
                            { label: "Awaiting Action", value: stats.pending, icon: Clock },
                            { label: "In Progress", value: stats.processing, icon: Activity },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.07 }}
                                className="bg-white border flex items-center gap-6 p-6"
                                style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                            >
                                <div
                                    className="h-12 w-12 flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: "#0a0a0a", borderRadius: "6px" }}
                                >
                                    <stat.icon className="h-5 w-5" style={{ color: "#c8ff00" }} />
                                </div>
                                <div>
                                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: "12px", color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                                        {stat.label}
                                    </p>
                                    <p
                                        style={{
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            fontWeight: 900,
                                            fontSize: "40px",
                                            lineHeight: 1,
                                            color: "#0a0a0a",
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Filter Tabs ──────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-2">
                        {["ALL", ...STATUS_OPTIONS].map(s => {
                            const active = filter === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className="px-4 py-2 text-[11px] uppercase tracking-[0.15em] transition-all duration-150 border"
                                    style={{
                                        borderRadius: "6px",
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 500,
                                        backgroundColor: active ? "#0a0a0a" : "white",
                                        color: active ? "#c8ff00" : "#8a8a8a",
                                        borderColor: active ? "#0a0a0a" : "rgba(10,10,10,0.1)",
                                    }}
                                >
                                    {s}
                                    {s !== "ALL" && (
                                        <span className="ml-2 opacity-50 tabular-nums">
                                            {orders.filter(o => o.status === s).length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Orders Table ─────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="bg-white border overflow-hidden"
                        style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                    >
                        {/* Table header */}
                        <div
                            className="grid border-b px-6"
                            style={{
                                gridTemplateColumns: "1.5fr 1.5fr 80px 120px 130px 140px",
                                borderColor: "rgba(10,10,10,0.08)",
                                backgroundColor: "#f5f3ef",
                            }}
                        >
                            {["Order ID", "Customer", "Items", "Total", "Status", "Update"].map(h => (
                                <div
                                    key={h}
                                    className="py-4 text-[10px] uppercase tracking-[0.18em]"
                                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#8a8a8a" }}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>

                        <div className="divide-y" style={{ borderColor: "rgba(10,10,10,0.06)" }}>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="px-6 py-5 animate-pulse">
                                            <div className="h-10 rounded-[6px]" style={{ backgroundColor: "#f5f3ef" }} />
                                        </div>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <div className="py-24 flex flex-col items-center gap-4">
                                        <ShoppingBag className="h-10 w-10" style={{ color: "#8a8a8a" }} />
                                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "24px", textTransform: "uppercase", letterSpacing: "0.02em", color: "#0a0a0a" }}>
                                            No Orders Found
                                        </p>
                                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "13px", color: "#8a8a8a" }}>
                                            Try adjusting your filter.
                                        </p>
                                    </div>
                                ) : (
                                    filtered.map(order => (
                                        <motion.div
                                            layout
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid px-6 py-4 cursor-pointer transition-colors duration-150 items-center"
                                            style={{
                                                gridTemplateColumns: "1.5fr 1.5fr 80px 120px 130px 140px",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f3ef")}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            {/* Order ID */}
                                            <div>
                                                <p
                                                    className="text-[11px] uppercase tracking-[0.12em]"
                                                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#0a0a0a" }}
                                                >
                                                    #{order.id.slice(-8).toUpperCase()}
                                                </p>
                                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "11px", color: "#8a8a8a", marginTop: "2px" }}>
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            </div>

                                            {/* Customer */}
                                            <div>
                                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "13px", color: "#0a0a0a" }}>
                                                    {order.user?.name || "Guest"}
                                                </p>
                                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "11px", color: "#8a8a8a", marginTop: "2px" }}>
                                                    {order.user?.email}
                                                </p>
                                            </div>

                                            {/* Items */}
                                            <div
                                                className="text-[12px]"
                                                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#8a8a8a" }}
                                            >
                                                {order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0}
                                            </div>

                                            {/* Total */}
                                            <div
                                                style={{
                                                    fontFamily: "'Barlow Condensed', sans-serif",
                                                    fontWeight: 900,
                                                    fontSize: "20px",
                                                    color: "#0a0a0a",
                                                    letterSpacing: "-0.01em",
                                                }}
                                            >
                                                ${(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>

                                            {/* Status */}
                                            <div onClick={e => e.stopPropagation()}>
                                                <StatusBadge status={order.status} />
                                            </div>

                                            {/* Status Select */}
                                            <div onClick={e => e.stopPropagation()} className="relative">
                                                <select
                                                    value={order.status}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                                    className="w-full appearance-none text-[11px] uppercase tracking-[0.1em] border px-3 py-2 pr-8 focus:outline-none transition-colors duration-150"
                                                    style={{
                                                        borderRadius: "6px",
                                                        borderColor: "rgba(10,10,10,0.15)",
                                                        backgroundColor: "#f5f3ef",
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        color: "#0a0a0a",
                                                    }}
                                                >
                                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#8a8a8a" }} />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                {/* ── Order Detail Slide-over ───────────────────────────── */}
                <AnimatePresence>
                    {selectedOrder && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedOrder(null)}
                                className="fixed inset-0 z-[100]"
                                style={{ backgroundColor: "rgba(10,10,10,0.5)", backdropFilter: "blur(4px)" }}
                            />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 36, stiffness: 260 }}
                                className="fixed right-0 top-0 h-full z-[101] flex flex-col"
                                style={{
                                    width: "min(580px, 100vw)",
                                    backgroundColor: "white",
                                    borderLeft: "1px solid rgba(10,10,10,0.1)",
                                    boxShadow: "-24px 0 60px rgba(10,10,10,0.12)",
                                }}
                            >
                                {/* Drawer Header */}
                                <div
                                    className="px-8 py-6 flex items-start justify-between border-b"
                                    style={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.06)" }}
                                >
                                    <div>
                                        <div
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-3 text-[10px] uppercase tracking-[0.18em]"
                                            style={{ backgroundColor: "#c8ff00", color: "#0a0a0a", borderRadius: "4px", fontWeight: 500 }}
                                        >
                                            <Zap className="h-3 w-3" />
                                            Order Detail
                                        </div>
                                        <h3
                                            style={{
                                                fontFamily: "'Barlow Condensed', sans-serif",
                                                fontWeight: 900,
                                                fontSize: "32px",
                                                textTransform: "uppercase",
                                                letterSpacing: "-0.01em",
                                                color: "#f5f3ef",
                                                lineHeight: 0.95,
                                            }}
                                        >
                                            #{selectedOrder.id.slice(-8).toUpperCase()}
                                        </h3>
                                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "12px", color: "#8a8a8a", marginTop: "6px" }}>
                                            {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="h-10 w-10 flex items-center justify-center border transition-colors"
                                        style={{ borderRadius: "6px", borderColor: "rgba(255,255,255,0.12)", backgroundColor: "transparent", color: "#8a8a8a" }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#c8ff00")}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto reyva-scrollbar" style={{ backgroundColor: "#f5f3ef" }}>
                                    <div className="p-8 space-y-6">

                                        {/* Status + Update */}
                                        <div
                                            className="bg-white border p-6 space-y-4"
                                            style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={labelCls}>Current Status</p>
                                                    <StatusBadge status={selectedOrder.status} />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={selectedOrder.status}
                                                        onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                                        className="appearance-none text-[11px] uppercase tracking-[0.1em] border px-4 py-2.5 pr-8 focus:outline-none transition-colors"
                                                        style={{
                                                            borderRadius: "6px",
                                                            borderColor: "#0a0a0a",
                                                            backgroundColor: "#0a0a0a",
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            fontWeight: 500,
                                                            color: "#c8ff00",
                                                        }}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#c8ff00" }} />
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    {STATUS_OPTIONS.slice(0, 4).map(s => {
                                                        const idx = STATUS_OPTIONS.indexOf(s);
                                                        const cur = STATUS_OPTIONS.indexOf(selectedOrder.status);
                                                        const done = idx <= cur && selectedOrder.status !== "CANCELLED";
                                                        return (
                                                            <div key={s} className="flex flex-col items-center gap-1">
                                                                <div
                                                                    className="h-2 w-2 rounded-full transition-all"
                                                                    style={{ backgroundColor: done ? "#0a0a0a" : "rgba(10,10,10,0.12)" }}
                                                                />
                                                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: done ? "#0a0a0a" : "#8a8a8a" }}>
                                                                    {s}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(10,10,10,0.08)" }}>
                                                    <div
                                                        className="h-full transition-all duration-500"
                                                        style={{
                                                            backgroundColor: selectedOrder.status === "CANCELLED" ? "#ef4444" : "#0a0a0a",
                                                            width: selectedOrder.status === "CANCELLED" ? "100%" :
                                                                `${(STATUS_OPTIONS.indexOf(selectedOrder.status) / 3) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer + Address */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                {
                                                    title: "Customer",
                                                    icon: User,
                                                    content: (
                                                        <>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "14px", color: "#0a0a0a" }}>{selectedOrder.user?.name || "Guest"}</p>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "12px", color: "#8a8a8a", marginTop: "2px" }}>{selectedOrder.user?.email}</p>
                                                            <Link href="/admin/customers" className="inline-flex items-center gap-1 mt-3 text-[10px] uppercase tracking-[0.15em] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#0a0a0a" }}>
                                                                View profile <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        </>
                                                    ),
                                                },
                                                {
                                                    title: "Shipping Address",
                                                    icon: MapPin,
                                                    content: selectedOrder.address ? (
                                                        <>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "13px", color: "#0a0a0a" }}>{selectedOrder.address.street}</p>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "12px", color: "#8a8a8a", marginTop: "2px" }}>
                                                                {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipCode}
                                                            </p>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: "11px", color: "#8a8a8a", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{selectedOrder.address.country}</p>
                                                        </>
                                                    ) : (
                                                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "12px", color: "#8a8a8a" }}>No address provided.</p>
                                                    ),
                                                },
                                            ].map(({ title, icon: Icon, content }) => (
                                                <div
                                                    key={title}
                                                    className="bg-white border p-5"
                                                    style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                                                >
                                                    <p className={labelCls + " flex items-center gap-1.5"}>
                                                        <Icon className="h-3 w-3" />
                                                        {title}
                                                    </p>
                                                    {content}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Items */}
                                        <div
                                            className="bg-white border overflow-hidden"
                                            style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)" }}
                                        >
                                            <div
                                                className="px-5 py-3 border-b flex items-center gap-2"
                                                style={{ borderColor: "rgba(10,10,10,0.08)", backgroundColor: "#f5f3ef" }}
                                            >
                                                <Package className="h-3.5 w-3.5" style={{ color: "#8a8a8a" }} />
                                                <span
                                                    className="text-[10px] uppercase tracking-[0.18em]"
                                                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#8a8a8a" }}
                                                >
                                                    {selectedOrder.items.length} Item{selectedOrder.items.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <div className="divide-y" style={{ borderColor: "rgba(10,10,10,0.06)" }}>
                                                {selectedOrder.items.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between px-5 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className="h-12 w-12 flex items-center justify-center shrink-0"
                                                                style={{ backgroundColor: "#f5f3ef", borderRadius: "6px", border: "1px solid rgba(10,10,10,0.08)" }}
                                                            >
                                                                <Package className="h-5 w-5" style={{ color: "#8a8a8a" }} />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "13px", color: "#0a0a0a" }}>{item.productTitle}</p>
                                                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "11px", color: "#8a8a8a", marginTop: "1px" }}>
                                                                    SKU: {item.sku || "—"} · Qty: {item.quantity}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "18px", color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                                                                ${(item.price * item.quantity).toFixed(2)}
                                                            </p>
                                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "11px", color: "#8a8a8a" }}>
                                                                ${item.price.toFixed(2)} each
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div
                                            className="border"
                                            style={{ borderRadius: "8px", borderColor: "rgba(10,10,10,0.1)", overflow: "hidden" }}
                                        >
                                            <div
                                                className="px-5 py-3 border-b flex items-center gap-2"
                                                style={{ borderColor: "rgba(10,10,10,0.08)", backgroundColor: "#f5f3ef" }}
                                            >
                                                <DollarSign className="h-3.5 w-3.5" style={{ color: "#8a8a8a" }} />
                                                <span
                                                    className="text-[10px] uppercase tracking-[0.18em]"
                                                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#8a8a8a" }}
                                                >
                                                    Payment Summary
                                                </span>
                                            </div>
                                            <div className="bg-white p-5 space-y-3">
                                                {[
                                                    { label: "Subtotal", value: `$${(selectedOrder.totalAmount * 0.9).toFixed(2)}` },
                                                    { label: "Shipping", value: "Included" },
                                                    { label: "Tax", value: `$${(selectedOrder.totalAmount * 0.1).toFixed(2)}` },
                                                ].map(row => (
                                                    <div key={row.label} className="flex justify-between">
                                                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: "13px", color: "#8a8a8a" }}>{row.label}</span>
                                                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "13px", color: "#0a0a0a" }}>{row.value}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: "rgba(10,10,10,0.1)" }}>
                                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "13px", color: "#0a0a0a" }}>Total</span>
                                                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "28px", color: "#0a0a0a", letterSpacing: "-0.02em" }}>
                                                        ${selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Drawer Footer */}
                                <div
                                    className="p-6 border-t grid grid-cols-2 gap-3"
                                    style={{ borderColor: "rgba(10,10,10,0.08)", backgroundColor: "white" }}
                                >
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="h-11 border uppercase tracking-[0.15em] text-[11px] transition-colors"
                                        style={{
                                            borderRadius: "6px",
                                            borderColor: "rgba(10,10,10,0.15)",
                                            backgroundColor: "transparent",
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            color: "#0a0a0a",
                                        }}
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => toast.loading("Processing fulfillment...", { duration: 2000 })}
                                        className="h-11 uppercase tracking-[0.15em] text-[11px] transition-all"
                                        style={{
                                            borderRadius: "6px",
                                            backgroundColor: "#0a0a0a",
                                            color: "#c8ff00",
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0a0a0a")}
                                    >
                                        Fulfill Order
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}