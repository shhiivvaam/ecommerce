"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";

interface AdminOrderItem {
    id: string;
    productTitle: string;
    price: number;
    quantity: number;
    sku?: string;
}

interface AdminOrder {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { email: string; name?: string };
    items: AdminOrderItem[];
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
}

interface AdminOrdersResponse {
    orders: AdminOrder[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Fetches all orders with admin pagination from /api/admin/orders.
 */
export function useAdminOrders(page = 1, limit = 20) {
    return useQuery<AdminOrdersResponse>({
        queryKey: queryKeys.admin.orders(page, limit),
        queryFn: async () => {
            const { data } = await apiClient.get<AdminOrdersResponse>("/admin/orders", {
                params: { page, limit },
            });
            return data;
        },
        staleTime: 30 * 1000, // 30s — orders change often
        placeholderData: (prev) => prev, // keep prev data while fetching next page
    });
}

/**
 * Mutation to update an order's status.
 * Optimistically updates then invalidates the admin orders cache.
 */
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation<AdminOrder, Error, { orderId: string; status: string }>({
        mutationFn: async ({ orderId, status }) => {
            const { data } = await apiClient.patch<AdminOrder>(
                `/admin/orders/${orderId}`,
                { status },
            );
            return data;
        },
        onSuccess: () => {
            // Invalidate all admin orders pages
            queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
