"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Package, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function AdminOverview() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState<{ id: string; user: { email: string }; totalAmount: number; status: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats({
                    totalRevenue: data.totalRevenue,
                    totalOrders: data.totalOrders,
                    totalProducts: data.totalProducts,
                    pendingOrders: data.statusCounts.find((sc: any) => sc.status === "PENDING")?._count || 0,
                });
                setRecentOrders(data.recentOrders);
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const kpis = [
        { title: "Total Revenue", value: loading ? "…" : `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
        { title: "Total Orders", value: loading ? "…" : stats.totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
        { title: "Products", value: loading ? "…" : stats.totalProducts, icon: Package, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
        { title: "Pending Orders", value: loading ? "…" : stats.pendingOrders, icon: Clock, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
    ];

    const STATUS_COLORS: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        PROCESSING: "bg-blue-100 text-blue-800",
        SHIPPED: "bg-purple-100 text-purple-800",
        DELIVERED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground mt-2">Welcome back. Here&apos;s a snapshot of your store.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi, index) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="rounded-xl border bg-card text-card-foreground shadow-sm p-6"
                    >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${kpi.color}`}>
                            <kpi.icon className="h-6 w-6" />
                        </div>
                        <div className="text-3xl font-bold">{kpi.value}</div>
                        <p className="text-sm text-muted-foreground mt-1">{kpi.title}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="rounded-xl border bg-card shadow-sm p-6 lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-lg">Recent Orders</h3>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline">View all →</Link>
                    </div>
                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                            ))
                        ) : recentOrders.length > 0 ? recentOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{order.user?.email ?? "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 12)}…</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold">${(order.totalAmount ?? 0).toFixed(2)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? ""}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm">No orders yet.</p>
                        )}
                    </div>
                </motion.div>

                {/* Quick links */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="rounded-xl border bg-card shadow-sm p-6"
                >
                    <h3 className="font-semibold text-lg mb-5">Quick Actions</h3>
                    <div className="space-y-2">
                        {[
                            { label: "Manage Products", href: "/admin/products" },
                            { label: "View Orders", href: "/admin/orders" },
                            { label: "Manage Categories", href: "/admin/categories" },
                            { label: "Create Coupon", href: "/admin/coupons" },
                        ].map(action => (
                            <Link key={action.href} href={action.href}
                                className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium group">
                                {action.label}
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
