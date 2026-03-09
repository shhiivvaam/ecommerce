import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export interface AnalyticsDashboard {
    totalRevenue: number;
    recentRevenue: number;
    totalOrders: number;
    recentOrders: number;
    activeUsers: number;
    averageOrderValue: number;
    topProducts: Array<{
        title: string;
        price: number;
        _count: {
            orderItems: number;
        };
    }>;
    recentActivities: Array<{
        action: string;
        entityType: string;
        createdAt: string;
    }>;
}

export function useAnalyticsDashboard() {
    return useQuery<AnalyticsDashboard>({
        queryKey: ["admin", "analytics"],
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/analytics/dashboard');
            return data;
        }
    });
}
