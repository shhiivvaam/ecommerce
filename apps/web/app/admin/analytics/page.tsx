"use client";

import { useAnalyticsDashboard } from "@/lib/hooks/useAnalytics";
import { format } from "date-fns";
import { Activity, DollarSign, Package, Users, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
    const { data, isLoading, error } = useAnalyticsDashboard();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight animate-pulse bg-muted rounded w-48 h-10 mb-2"></h1>
                    <p className="bg-muted rounded w-64 h-4 animate-pulse"></p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border rounded-xl p-6 bg-card h-32 animate-pulse mb-6"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">Failed to load analytics data. Ensure you have the required permissions.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Performance metrics, revenue, and store activity over the last 30 days.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="border rounded-xl p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-foreground">
                            ${data.totalRevenue?.toFixed(2) || "0.00"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+${data.recentRevenue?.toFixed(2) || "0.00"}</span> in last 30 days
                        </p>
                    </div>
                </div>

                <div className="border rounded-xl p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-foreground">
                            {data.totalOrders || 0}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+{data.recentOrders || 0}</span> in last 30 days
                        </p>
                    </div>
                </div>

                <div className="border rounded-xl p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-foreground">
                            {data.activeUsers || 0}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Users engaged within 30 days</p>
                    </div>
                </div>

                <div className="border rounded-xl p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-muted-foreground">System Health</p>
                        <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-primary">
                            Healthy
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">API endpoints resolving</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-muted/30">
                        <h3 className="font-semibold text-lg">Top Selling Products</h3>
                    </div>
                    <div className="divide-y relative">
                        {data.topProducts?.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No sales data available.</div>
                        ) : (
                            data.topProducts?.map((product, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">{product.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">${(product.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{product._count?.orderItems || 0}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Units Sold</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-muted/30">
                        <h3 className="font-semibold text-lg">Recent Administrative Actions</h3>
                    </div>
                    <div className="divide-y relative max-h-[400px] overflow-y-auto">
                        {data.recentActivities?.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No recent activity.</div>
                        ) : (
                            data.recentActivities?.map((activity, i) => (
                                <div key={i} className="px-6 py-4 text-sm">
                                    <div className="flex items-start justify-between">
                                        <p className="font-medium text-sm">
                                            <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground mr-2">
                                                {activity.action}
                                            </span>
                                            {activity.entityType}
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                            {format(new Date(activity.createdAt), "MMM d, HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
