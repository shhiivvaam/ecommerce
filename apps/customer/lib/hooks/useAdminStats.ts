"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";

interface AdminStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    pendingOrders: number;
    outOfStockCount: number;
    lowStockCount: number;
    statusCounts: Array<{ status: string; _count: number }>;
    recentOrders: Array<{
        id: string;
        user: { email: string; name?: string };
        totalAmount: number;
        status: string;
        createdAt: string;
    }>;
}

/**
 * Fetches overall admin store stats from /api/admin/stats.
 * Only enabled when the user is authenticated (admin role enforced on backend).
 */
export function useAdminStats() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<AdminStats>({
        queryKey: queryKeys.admin.stats,
        queryFn: async () => {
            const { data } = await apiClient.get<AdminStats>("/admin/stats");
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 60 * 1000, // 1 minute — stats can change frequently
    });
}
