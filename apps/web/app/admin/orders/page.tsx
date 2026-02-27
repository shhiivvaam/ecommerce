"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronDown, RefreshCw, ShoppingBag, Clock, CheckCircle2, Package, X, MapPin, User, DollarSign, ExternalLink, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    PROCESSING: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
    SHIPPED: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
    DELIVERED: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
    CANCELLED: "bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-950/30",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders/admin/all');
            setOrders(data);
        } catch {
            toast.error("Cloud synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleStatusChange = async (orderId: string, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status });
            }
            toast.success(`Order transition: ${status}`);
        } catch {
            toast.error("Status update rejected");
        }
    };

    const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === "PENDING").length,
        processing: orders.filter(o => o.status === "PROCESSING").length,
    };

    return (
        <div className="space-y-16 pb-20 relative min-h-screen transition-colors duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Logistics Core</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">Transaction <br />Logistics</h2>
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Control tower for global order flow and fulfillment intelligence.</p>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={fetchOrders} className="rounded-[20px] h-16 px-10 gap-3 border-4 border-slate-50 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Sync Logistics
                    </Button>
                </div>
            </header>

            {/* Global Order Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Active Volume", value: stats.total, icon: ShoppingBag, color: "bg-blue-600 dark:bg-blue-500" },
                    { label: "Awaiting Action", value: stats.pending, icon: Clock, color: "bg-amber-600 dark:bg-amber-500" },
                    { label: "Transit Flow", value: stats.processing, icon: Activity, color: "bg-indigo-600 dark:bg-indigo-500" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white dark:bg-[#0a0a0a] border-4 border-slate-50 dark:border-slate-800 rounded-[40px] p-10 flex items-center gap-8 shadow-sm transition-all hover:shadow-2xl"
                    >
                        <div className={`h-20 w-20 rounded-[28px] ${stat.color} text-white flex items-center justify-center shadow-2xl`}>
                            <stat.icon className="h-10 w-10" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic mb-1">{stat.label}</p>
                            <h4 className="text-5xl font-black tracking-tighter text-black dark:text-white tabular-nums">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-10">
                {/* Filtration Matrix */}
                <div className="flex flex-wrap gap-3 bg-slate-100/50 dark:bg-white/5 p-3 rounded-[32px] w-fit border-4 border-slate-50 dark:border-slate-900 transition-colors">
                    {["ALL", ...STATUS_OPTIONS].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s
                                ? "bg-white dark:bg-black text-primary shadow-xl scale-[1.05] border-2 border-primary/10"
                                : "text-slate-400 dark:text-slate-600 hover:text-black dark:hover:text-white"
                                }`}
                        >
                            {s} {s !== "ALL" && <span className="ml-2 opacity-30 tabular-nums">{orders.filter(o => o.status === s).length}</span>}
                        </button>
                    ))}
                </div>

                <div className="bg-white dark:bg-[#0a0a0a] border-4 border-slate-50 dark:border-slate-800 rounded-[56px] overflow-hidden shadow-2xl transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b-4 border-slate-50 dark:border-slate-900">
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-left">Transaction ID</th>
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-left">Customer Profile</th>
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-center">Payload</th>
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-right">Net Liability</th>
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-center">Status</th>
                                    <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-slate-50 dark:divide-slate-900">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="p-10"><div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-[32px]" /></td>
                                            </tr>
                                        ))
                                    ) : filtered.length > 0 ? (
                                        filtered.map(order => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={order.id}
                                                className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <td className="px-10 py-10">
                                                    <span className="font-black text-[10px] bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-slate-400 dark:text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-all uppercase tracking-widest border-2 border-transparent group-hover:border-primary/20 italic shadow-inner">#{(order.id || "").slice(-8).toUpperCase()}</span>
                                                    <p className="text-[10px] text-slate-300 dark:text-slate-700 mt-4 font-black uppercase tracking-[0.2em] italic transition-colors group-hover:text-primary/50">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <p className="font-black text-lg text-black dark:text-white leading-none uppercase tracking-tight">{order.user?.name || "Independent Node"}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-2 font-medium italic">{order.user?.email}</p>
                                                </td>
                                                <td className="px-10 py-10 text-center">
                                                    <div className="inline-flex items-center gap-3 text-slate-300 dark:text-slate-700 font-black text-[10px] uppercase tracking-widest bg-slate-50/50 dark:bg-white/5 px-4 py-2 rounded-2xl border-2 border-slate-50 dark:border-slate-800 italic group-hover:border-primary/20 transition-all">
                                                        <Package className="h-4 w-4" />
                                                        {order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} Entities
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <p className="font-black text-3xl tracking-tighter text-black dark:text-white tabular-nums">${(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    <div className="flex items-center justify-end gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 italic">
                                                        <CheckCircle2 className="h-3 w-3" /> Node Secure
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10 text-center">
                                                    <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm transition-colors ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-10 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="relative group/select">
                                                        <select
                                                            value={order.status}
                                                            onChange={e => handleStatusChange(order.id, e.target.value)}
                                                            className="appearance-none text-[10px] font-black border-4 border-slate-50 dark:border-slate-800 rounded-2xl px-6 py-3 pr-12 bg-white dark:bg-black text-black dark:text-white cursor-pointer group-hover/select:border-primary/20 transition-all focus:outline-none tracking-widest uppercase italic outline-none"
                                                        >
                                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-slate-700 pointer-events-none group-hover/select:text-primary transition-colors" />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-8">
                                                    <div className="h-24 w-24 bg-slate-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-slate-100 dark:text-slate-900 border-2 border-slate-50 dark:border-slate-900">
                                                        <ShoppingBag className="h-12 w-12" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Log Void</h4>
                                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-600 italic">Adjust your status parameters to detect sequences.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order Detail Slide-over */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 35, stiffness: 250 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border-l-4 border-slate-50 dark:border-slate-900 shadow-3xl z-[101] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-12 border-b-4 border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 relative transition-colors">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">Manifest Details</h3>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${STATUS_COLORS[selectedOrder.status]}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black font-mono text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">ID REFERENCE: {selectedOrder.id}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="rounded-2xl h-14 w-14 border-4 border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X className="h-8 w-8 text-black dark:text-white" />
                                </Button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar transition-colors">
                                {/* Section: Logistics Progress */}
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 italic flex items-center gap-4 px-2">
                                        <Zap className="h-5 w-5 text-primary" /> Fulfillment Phase
                                    </h4>
                                    <div className="flex justify-between items-center relative px-4">
                                        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1.5 bg-slate-50 dark:bg-white/5 rounded-full" />
                                        {STATUS_OPTIONS.slice(0, 4).map((s, idx) => {
                                            const activeIdx = STATUS_OPTIONS.indexOf(selectedOrder.status);
                                            const isDone = STATUS_OPTIONS.indexOf(s) <= activeIdx;
                                            return (
                                                <div key={s} className="relative z-10 flex flex-col items-center gap-4 bg-white dark:bg-[#0a0a0a] transition-colors p-2">
                                                    <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-primary border-primary text-white scale-125 shadow-2xl' : 'bg-white dark:bg-[#0a0a0a] border-slate-50 dark:border-slate-900 text-slate-200 dark:text-slate-800'}`}>
                                                        {isDone ? <CheckCircle2 className="h-6 w-6" /> : <span className="text-xs font-black">{idx + 1}</span>}
                                                    </div>
                                                    <span className={`text-[9px] font-black tracking-widest uppercase italic transition-colors ${isDone ? 'text-black dark:text-white' : 'text-slate-100 dark:text-slate-900'}`}>{s}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-100 dark:border-slate-900 rounded-[32px] p-8 flex items-center justify-between transition-colors">
                                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">Transition Phase:</p>
                                        <div className="relative group/select">
                                            <select
                                                value={selectedOrder.status}
                                                onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                                className="appearance-none text-[10px] font-black border-4 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 pr-12 bg-white dark:bg-black text-black dark:text-white cursor-pointer transition-all uppercase tracking-widest outline-none italic shadow-xl"
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-slate-700 pointer-events-none group-hover/select:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Entity Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 border-4 border-slate-50 dark:border-slate-900 space-y-6 hover:border-primary/20 transition-all shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 flex items-center gap-3 italic">
                                            <User className="h-5 w-5" /> Customer Entity
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black text-black dark:text-white uppercase tracking-tight leading-none">{selectedOrder.user?.name || "Independent Node"}</p>
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-600 italic">{selectedOrder.user?.email}</p>
                                        </div>
                                        <div className="pt-2">
                                            <Link href={`/admin/customers`} className="inline-flex items-center gap-3 text-[10px] font-black uppercase text-primary tracking-widest italic hover:gap-5 transition-all">
                                                Entity Profile <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 border-4 border-slate-50 dark:border-slate-900 space-y-6 hover:border-primary/20 transition-all shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 flex items-center gap-3 italic">
                                            <MapPin className="h-5 w-5" /> Deployment Node
                                        </h4>
                                        {selectedOrder.address ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-black text-black dark:text-white uppercase tracking-widest leading-tight">{selectedOrder.address.street}</p>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase italic leading-relaxed">{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipCode}</p>
                                                <div className="pt-2">
                                                    <span className="text-[9px] font-black bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] border-2 border-slate-50 dark:border-slate-900">{selectedOrder.address.country}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-black text-slate-100 dark:text-slate-900 italic uppercase">Log void: No address.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Section: Itemized Manifest */}
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 italic flex items-center gap-4 px-4">
                                        <Package className="h-5 w-5 text-indigo-500" /> itemized Manifest
                                    </h4>
                                    <div className="bg-white dark:bg-[#050505] border-4 border-slate-50 dark:border-slate-900 rounded-[40px] overflow-hidden transition-colors shadow-inner">
                                        <div className="divide-y-4 divide-slate-50 dark:divide-slate-900">
                                            {selectedOrder.items.map((item) => (
                                                <div key={item.id} className="p-10 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-8">
                                                        <div className="h-20 w-20 rounded-[28px] bg-slate-50 dark:bg-black flex items-center justify-center font-black text-[10px] text-slate-100 dark:text-slate-900 border-2 border-slate-50 dark:border-slate-900 shadow-inner group-hover:text-primary transition-colors italic">
                                                            P-IMG
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="font-black text-lg text-black dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{item.productTitle}</p>
                                                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase italic tracking-widest">SKU: {item.sku || "PROT-UNIDENTIFIED"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <p className="text-2xl font-black text-black dark:text-white tabular-nums tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                                                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">{item.quantity} UNITS @ ${item.price.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Financial Settlement */}
                                <div className="bg-slate-50 dark:bg-white/5 rounded-[48px] p-12 border-4 border-slate-100 dark:border-slate-900 space-y-10 transition-colors shadow-inner">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 flex items-center gap-4 italic px-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" /> Settlement Summary
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2 italic">
                                            <span>Subtotal Phase</span>
                                            <span className="tabular-nums">${(selectedOrder.totalAmount * 0.9).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2 italic">
                                            <span>Logistics Fee</span>
                                            <span className="tabular-nums text-emerald-500">SYSTEM SUBSIDY</span>
                                        </div>
                                        <div className="pt-10 border-t-4 border-white dark:border-black flex justify-between items-end px-2">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 italic">Net Capture</span>
                                                <p className="text-xl font-black text-black dark:text-white uppercase tracking-tighter leading-none opacity-40">Final Settlement</p>
                                            </div>
                                            <span className="text-6xl font-black tabular-nums tracking-tighter text-black dark:text-white">${selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-12 border-t-4 border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-[#050505] grid grid-cols-2 gap-8 transition-colors">
                                <Button variant="outline" className="h-20 rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] border-4 border-slate-100 dark:border-slate-800 transition-all active:scale-95" onClick={() => setSelectedOrder(null)}>
                                    Exit Manifest
                                </Button>
                                <Button className="h-20 rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 transition-all active:scale-95" onClick={() => {
                                    toast.loading("INITIALIZING PACKING SEQUENCE...", { duration: 2000 });
                                }}>
                                    Execute Fulfillment
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
