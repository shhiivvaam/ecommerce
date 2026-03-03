"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ChevronDown, RefreshCw, ShoppingBag, Clock,
    Package, X, MapPin, User, DollarSign,
    ExternalLink, Zap, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminOrders, useUpdateOrderStatus } from "@/lib/hooks/useAdminOrders";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const INK = "#0a0a0a";
const PAPER = "#f5f3ef";
const ACCENT = "#c8ff00";
const MID = "#8a8a8a";
const BORDER = "rgba(10,10,10,0.1)";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING: { bg: "#fff8e1", text: "#7a5c00", dot: "#f5b800" },
    PROCESSING: { bg: "#e8f0fe", text: "#1a3e8c", dot: "#3b6ff5" },
    SHIPPED: { bg: "#f3e8ff", text: "#5b21b6", dot: "#8b5cf6" },
    DELIVERED: { bg: "#e6f9f0", text: "#14532d", dot: "#22c55e" },
    CANCELLED: { bg: "#fce8e8", text: "#7f1d1d", dot: "#ef4444" },
};

const labelCls = "block text-[10px] font-['DM_Sans'] font-500 uppercase tracking-[0.18em] text-[#8a8a8a] mb-2";

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] ?? { bg: PAPER, text: MID, dot: MID };
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em]"
            style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: meta.bg, color: meta.text, borderRadius: "4px" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
            {status}
        </span>
    );
}

// Type re-use from the hook
type AdminOrder = NonNullable<ReturnType<typeof useAdminOrders>["data"]>["orders"][0];

export default function AdminOrdersPage() {
    const [filter, setFilter] = useState("ALL");
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading: loading, refetch } = useAdminOrders(page, limit);
    const { mutate: updateStatus } = useUpdateOrderStatus();

    const orders = data?.orders ?? [];
    const total = data?.total ?? 0;

    const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

    const stats = {
        total,
        pending: orders.filter(o => o.status === "PENDING").length,
        processing: orders.filter(o => o.status === "PROCESSING").length,
    };

    const handleStatusChange = (orderId: string, status: string) => {
        updateStatus({ orderId, status }, {
            onSuccess: () => {
                // Keep selected order panel in sync
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status } : null);
                }
            },
        });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
                .ao-wrap { font-family:'DM Sans',sans-serif; color:${INK}; padding-bottom:80px; }
                .ao-header-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,72px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-0.02em; }
                .ao-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1px; background:${BORDER}; border:1px solid ${BORDER}; border-radius:10px; overflow:hidden; margin-bottom:32px; }
                .ao-kpi { background:#fff; padding:20px 24px; }
                .ao-kpi-val { font-family:'Barlow Condensed',sans-serif; font-size:36px; font-weight:900; line-height:1; letter-spacing:-0.02em; }
                .ao-kpi-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:${MID}; margin-top:4px; }
                .ao-filter-bar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; align-items:center; }
                .ao-filter-btn { padding:8px 16px; border-radius:6px; border:1.5px solid ${BORDER}; background:transparent; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:${MID}; cursor:pointer; transition:all .2s; }
                .ao-filter-btn.active { background:${INK}; border-color:${INK}; color:#fff; }
                .ao-filter-btn:hover:not(.active) { border-color:${INK}; color:${INK}; }
                .ao-table { width:100%; border-collapse:collapse; background:#fff; border:1px solid ${BORDER}; border-radius:10px; overflow:hidden; }
                .ao-th { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:${MID}; padding:12px 20px; text-align:left; border-bottom:1px solid ${BORDER}; background:${PAPER}; }
                .ao-td { padding:14px 20px; font-size:13px; border-bottom:1px solid ${BORDER}; }
                tr:last-child .ao-td { border-bottom:none; }
                .ao-row { cursor:pointer; transition:background .15s; }
                .ao-row:hover { background:${PAPER}; }
                .ao-select { height:32px; padding:0 28px 0 10px; border:1.5px solid ${BORDER}; border-radius:6px; background:${PAPER}; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:${INK}; cursor:pointer; outline:none; appearance:none; transition:border-color .2s; }
                .ao-select:focus { border-color:${INK}; }
                .ao-pagination { display:flex; align-items:center; gap:12px; padding:16px 20px; border-top:1px solid ${BORDER}; background:${PAPER}; }
                .ao-pg-btn { height:32px; min-width:80px; padding:0 16px; border-radius:6px; border:1.5px solid ${BORDER}; background:transparent; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:${MID}; cursor:pointer; transition:all .2s; }
                .ao-pg-btn:hover:not(:disabled) { border-color:${INK}; color:${INK}; }
                .ao-pg-btn:disabled { opacity:.35; cursor:not-allowed; }
                .ao-skel { background:rgba(10,10,10,0.06); border-radius:6px; animation:ao-pulse 1.4s ease-in-out infinite; }
                @keyframes ao-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
            `}</style>

            <div className="ao-wrap">
                {/* Header */}
                <div style={{ marginBottom: 32, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>
                            Order Management
                        </span>
                        <h1 className="ao-header-title">All Orders</h1>
                        <p style={{ fontSize: 13, color: MID, fontWeight: 300, marginTop: 6 }}>
                            View, filter, and update order statuses across the store.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => refetch()}
                            style={{ height: 44, padding: "0 16px", borderRadius: 8, border: `1.5px solid ${BORDER}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: MID, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            <RefreshCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} /> Refresh
                        </button>
                        <Link href="/admin/products/new"
                            style={{ height: 44, padding: "0 20px", borderRadius: 8, background: INK, color: "#fff", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
                            <Package size={14} /> View Products
                        </Link>
                    </div>
                </div>

                {/* KPI strip */}
                <div className="ao-kpi-grid">
                    {[
                        { label: "Total Orders", val: stats.total, accent: false },
                        { label: "Pending", val: stats.pending, accent: stats.pending > 0 },
                        { label: "Processing", val: stats.processing, accent: false },
                        { label: "Page", val: `${page} / ${Math.ceil(total / limit) || 1}`, accent: false },
                    ].map(({ label, val, accent }) => (
                        <div key={label} className="ao-kpi" style={{ background: accent ? INK : "#fff" }}>
                            <div className="ao-kpi-val" style={{ color: accent ? ACCENT : INK }}>{val}</div>
                            <div className="ao-kpi-label" style={{ color: accent ? "rgba(255,255,255,0.45)" : MID }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="ao-filter-bar">
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: MID }}>Filter:</span>
                    {["ALL", ...STATUS_OPTIONS].map(s => (
                        <button key={s} className={`ao-filter-btn${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="ao-skel" style={{ height: 320, borderRadius: 10 }} />
                ) : filtered.length > 0 ? (
                    <table className="ao-table">
                        <thead>
                            <tr>
                                {["Order", "Customer", "Amount", "Status", "Date", "Update"].map(h => (
                                    <th key={h} className="ao-th">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, i) => (
                                <motion.tr key={order.id} className="ao-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    onClick={() => setSelectedOrder(order)}>
                                    <td className="ao-td" style={{ fontFamily: "monospace", fontSize: 12 }}>#{order.id.slice(-8).toUpperCase()}</td>
                                    <td className="ao-td">
                                        <p style={{ fontWeight: 500, color: INK }}>{order.user.name || "—"}</p>
                                        <p style={{ fontSize: 11, color: MID, fontWeight: 300 }}>{order.user.email}</p>
                                    </td>
                                    <td className="ao-td" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700 }}>
                                        ${order.totalAmount.toFixed(2)}
                                    </td>
                                    <td className="ao-td"><StatusBadge status={order.status} /></td>
                                    <td className="ao-td" style={{ color: MID, fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="ao-td" onClick={e => e.stopPropagation()}>
                                        <div style={{ position: "relative" }}>
                                            <select className="ao-select" value={order.status}
                                                onChange={e => handleStatusChange(order.id, e.target.value)}>
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: MID, pointerEvents: "none" }} />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: "center", padding: "60px 24px", border: `1.5px dashed ${BORDER}`, borderRadius: 10 }}>
                        <ShoppingBag size={36} style={{ color: "rgba(10,10,10,0.15)", margin: "0 auto 12px" }} />
                        <p style={{ color: MID, fontSize: 14, fontWeight: 300 }}>No orders match the current filter.</p>
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="ao-pagination">
                        <button className="ao-pg-btn" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); }}>← Prev</button>
                        <span style={{ fontSize: 12, color: MID, fontWeight: 300 }}>Page {page} of {Math.ceil(total / limit)}</span>
                        <button className="ao-pg-btn" disabled={page >= Math.ceil(total / limit)} onClick={() => { const p = page + 1; setPage(p); }}>Next →</button>
                    </div>
                )}
            </div>

            {/* Order detail panel */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div className="fixed inset-0 z-[100]" style={{ backgroundColor: "rgba(10,10,10,0.5)" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                            onClick={() => setSelectedOrder(null)} />
                        <motion.aside className="fixed right-0 top-0 h-full z-[110] flex flex-col overflow-y-auto"
                            style={{ width: "min(580px, 100vw)", backgroundColor: "#fff", borderLeft: `1px solid ${BORDER}`, boxShadow: "-8px 0 40px rgba(10,10,10,0.12)" }}
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-8 py-6 shrink-0" style={{ backgroundColor: INK, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                <div>
                                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#fff" }}>
                                        Order #{selectedOrder.id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="mt-0.5 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "rgba(255,255,255,0.45)" }}>
                                        {new Date(selectedOrder.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/10"
                                    style={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
                                    <X size={16} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 flex-1">
                                {/* Status update */}
                                <div style={{ backgroundColor: PAPER, borderRadius: 8, padding: 20, border: `1px solid ${BORDER}` }}>
                                    <label className={labelCls}>Update Status</label>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <StatusBadge status={selectedOrder.status} />
                                        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                                            <select className="ao-select" style={{ width: "100%" }} value={selectedOrder.status}
                                                onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}>
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: MID, pointerEvents: "none" }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Customer */}
                                <div>
                                    <span className="flex items-center gap-2 mb-3" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>
                                        <User size={12} strokeWidth={1.5} /> Customer
                                    </span>
                                    <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: "16px 20px", border: `1px solid ${BORDER}` }}>
                                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, textTransform: "uppercase", color: INK }}>{selectedOrder.user.name || "—"}</p>
                                        <p style={{ fontSize: 12, color: MID, fontWeight: 300, marginTop: 2 }}>{selectedOrder.user.email}</p>
                                    </div>
                                </div>

                                {/* Address */}
                                {selectedOrder.address && (
                                    <div>
                                        <span className="flex items-center gap-2 mb-3" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>
                                            <MapPin size={12} strokeWidth={1.5} /> Shipping Address
                                        </span>
                                        <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: "16px 20px", border: `1px solid ${BORDER}` }}>
                                            <p style={{ fontSize: 13, color: INK, fontWeight: 400, lineHeight: 1.6 }}>
                                                {selectedOrder.address.street}<br />
                                                {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipCode}<br />
                                                {selectedOrder.address.country}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Items */}
                                <div>
                                    <span className="flex items-center gap-2 mb-3" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>
                                        <Package size={12} strokeWidth={1.5} /> Order Items ({selectedOrder.items?.length ?? 0})
                                    </span>
                                    <div className="space-y-2">
                                        {(selectedOrder.items ?? []).map(item => (
                                            <div key={item.id} style={{ backgroundColor: "#fff", borderRadius: 8, padding: "14px 20px", border: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.productTitle}</p>
                                                    {item.sku && <p style={{ fontSize: 11, color: MID, fontWeight: 300, marginTop: 2 }}>SKU: {item.sku}</p>}
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: INK }}>${(item.price * item.quantity).toFixed(2)}</p>
                                                    <p style={{ fontSize: 11, color: MID, fontWeight: 300 }}>{item.quantity} × ${item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div style={{ backgroundColor: INK, borderRadius: 8, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                                        <DollarSign size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "text-top" }} /> Order Total
                                    </span>
                                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, color: ACCENT }}>
                                        ${selectedOrder.totalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
