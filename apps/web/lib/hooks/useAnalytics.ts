"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";

interface AnalyticsData {
    overview: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    salesByDay: Array<{ date: string; amount: number }>;
    topSellingProducts: Array<{ productId: string; title: string; totalSold: number }>;
}

export function useAnalytics() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<AnalyticsData>({
        queryKey: [...queryKeys.admin.stats, "analytics"],
        queryFn: async () => {
            const { data } = await apiClient.get<AnalyticsData>("/admin/analytics/dashboard");
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });
}
