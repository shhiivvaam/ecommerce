"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import toast from "react-hot-toast";

export interface ReturnRequestData {
    orderId: string;
    items: { productId: string; variantId?: string; quantity: number }[];
    reason: string;
}

export function useOrderDetails(orderId: string) {
    return useQuery({
        queryKey: ["orders", "detail", orderId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/orders/${orderId}`);
            return data;
        },
        enabled: !!orderId,
    });
}

export function useInitiateReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ReturnRequestData) => {
            const { data } = await apiClient.post(`/returns`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["orders", "detail", variables.orderId] });
            toast.success("Return request has been submitted successfully.");
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to submit return request");
        }
    });
}
