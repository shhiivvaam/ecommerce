"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import type { Order } from "@repo/types";
import toast from "react-hot-toast";

/**
 * Fetches the current user's order history.
 * Only enabled when authenticated.
 */
export function useOrders() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<Order[]>({
        queryKey: queryKeys.orders.all,
        queryFn: async () => {
            const { data } = await apiClient.get<Order[]>("/orders");
            return data;
        },
        enabled: isAuthenticated,
    });
}

/**
 * Fetches a single order by ID.
 */
export function useOrder(id: string | null | undefined) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<Order>({
        queryKey: queryKeys.orders.detail(id ?? ""),
        queryFn: async () => {
            const { data } = await apiClient.get<Order>(`/orders/${id}`);
            return data;
        },
        enabled: isAuthenticated && Boolean(id),
    });
}

/**
 * Creates a new order (checkout submission).
 * Invalidates orders list and cart after success.
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation<Order, Error, { couponCode?: string }>({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post<Order>("/orders", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
