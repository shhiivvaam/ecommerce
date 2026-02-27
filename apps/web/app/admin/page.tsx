"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Package, Clock, Users, ArrowUpRight, TrendingUp, Activity } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function AdminOverview() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState<{ id: string; user: { email: string; name?: string }; totalAmount: number; status: string; createdAt: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats({
                    totalRevenue: data.totalRevenue,
                    totalOrders: data.totalOrders,
                    totalProducts: data.totalProducts,
                    totalUsers: data.totalUsers || 0,
                    pendingOrders: data.statusCounts?.find((sc: { status: string; _count: number }) => sc.status === "PENDING")?._count || 0,
                });
                setRecentOrders(data.recentOrders || []);
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const kpis = [
        { title: "Net Revenue", value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-emerald-500", trend: "+12.5%" },
        { title: "Active Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-500", trend: "+3.2%" },
        { title: "Inventory", value: stats.totalProducts, icon: Package, color: "bg-indigo-500", trend: "Stable" },
        { title: "Customer Base", value: stats.totalUsers, icon: Users, color: "bg-rose-500", trend: "+24 today" },
    ];

    const STATUS_STYLING: Record<string, string> = {
        PENDING: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
        PROCESSING: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
        SHIPPED: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
        DELIVERED: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
        CANCELLED: "bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-950/30",
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Hub</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">Admin <br />Performance</h2>
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Real-time health pulse of your sovereign digital commerce engine.</p>
                </div>
                <div className="px-6 py-3 bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/10 dark:border-emerald-500/20 rounded-[20px] flex items-center gap-4 transition-colors">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Node Sync Active</span>
                </div>
            </header>

            {/* KPI Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpis.map((kpi, index) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="group relative rounded-[40px] border-2 border-slate-50 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center text-white ${kpi.color} shadow-2xl`}>
                                <kpi.icon className="h-8 w-8" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 dark:text-slate-600 uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
                                    {kpi.trend}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2 relative z-10">
                            <h4 className="text-4xl font-black tracking-tighter text-black dark:text-white">{loading ? "..." : kpi.value}</h4>
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">{kpi.title}</p>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] rotate-12 transition-transform group-hover:scale-150 duration-1000">
                            <kpi.icon className="h-40 w-40" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-12">
                {/* Visual Velocity Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-8 bg-white dark:bg-[#0a0a0a] border-2 border-slate-50 dark:border-slate-800 rounded-[56px] p-12 shadow-sm relative overflow-hidden transition-colors"
                >
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-2">
                            <h3 className="font-black text-3xl uppercase tracking-tight flex items-center gap-4 text-black dark:text-white">
                                <TrendingUp className="h-8 w-8 text-primary" />
                                Sales Velocity
                            </h3>
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">Temporal distribution of acquisition sequences across the grid.</p>
                        </div>
                    </div>

                    <div className="h-80 flex items-end justify-between gap-2 w-full pb-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 80 + 10}%` }}
                                transition={{ delay: 0.6 + (i * 0.03), type: "spring", stiffness: 40 }}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 hover:bg-primary dark:hover:bg-primary rounded-t-2xl transition-all relative group cursor-crosshair border-x border-transparent"
                            >
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black px-4 py-2 rounded-2xl opacity-0 group-hover:opacity-100 shadow-3xl transition-all pointer-events-none whitespace-nowrap z-20">
                                    {(Math.random() * 10).toFixed(0)} PROTOCOLS
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-8 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] px-2 italic">
                        <span>Yesterday</span>
                        <span>Grid Meridian</span>
                        <span>Now</span>
                    </div>
                </motion.div>

                {/* Protocol Shortcuts */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="lg:col-span-4 bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[56px] p-12 space-y-10 transition-colors"
                >
                    <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-4 text-black dark:text-white">
                        <Activity className="h-6 w-6 text-indigo-500" />
                        Control Hub
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { label: "Inventory Logic", href: "/admin/products", icon: Package, color: "text-purple-600 dark:text-purple-400" },
                            { label: "Dispatch Module", href: "/admin/orders", icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400" },
                            { label: "Global Policies", href: "/admin/settings", icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Auth & Access", href: "/admin/customers", icon: Users, color: "text-rose-600 dark:text-rose-400" },
                        ].map((action, i) => (
                            <Link key={action.href} href={action.href}
                                className="flex items-center gap-6 p-6 rounded-[32px] bg-white dark:bg-black border-2 border-transparent hover:border-primary/10 hover:shadow-2xl transition-all group active:scale-95 shadow-sm">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 group-hover:bg-primary group-hover:text-white transition-all shadow-inner ${action.color}`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">{action.label}</span>
                                <ArrowUpRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Transaction Manifest */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="lg:col-span-12 bg-white dark:bg-[#0a0a0a] border-2 border-slate-50 dark:border-slate-800 rounded-[56px] p-12 shadow-sm transition-colors"
                >
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-2">
                            <h3 className="font-black text-3xl uppercase tracking-tight text-black dark:text-white">Recent Protocol Stream</h3>
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">Continuous feed of all incoming acquisition sequences.</p>
                        </div>
                        <Link href="/admin/orders" className="h-14 px-8 flex items-center bg-slate-50 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">Full Log Access</Link>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[32px]" />
                            ))
                        ) : recentOrders.length > 0 ? recentOrders.map((order, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + (i * 0.05) }}
                                key={order.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 rounded-[32px] border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[24px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 font-black text-xs uppercase group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                        #{(order.id || "").slice(-4)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-lg leading-none text-black dark:text-white uppercase tracking-tight">{order.user?.name || "Independent Node"}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-600 font-medium italic">{order.user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-6 sm:mt-0 flex items-center gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-right space-y-1">
                                        <p className="text-2xl font-black tracking-tighter text-black dark:text-white tabular-nums">${(order.totalAmount || 0).toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-300 dark:text-slate-700 uppercase font-black tracking-widest italic">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${STATUS_STYLING[order.status] || "bg-muted"}`}>
                                        {order.status}
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                                <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-100 dark:text-slate-900 border-2 border-slate-50 dark:border-slate-900">
                                    <Clock className="h-10 w-10 flex-shrink-0" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 text-[10px]">No Activity Stream Detected</p>
                                    <p className="text-sm font-medium text-slate-300 dark:text-slate-700 italic">The network is currently idle. Awaiting acquisition sequence.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
