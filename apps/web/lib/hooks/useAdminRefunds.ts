"use client";

import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface RefundRequest {
    id: string;
    orderId: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    reason: string | null;
    createdAt: string;
    order: {
        id: string;
        user: { name?: string; email: string };
    };
}

export interface RefundsResponse {
    refunds: RefundRequest[];
    total: number;
    page: number;
    limit: number;
}

export function useAdminRefunds(page = 1, limit = 20) {
    return useQuery<RefundsResponse>({
        queryKey: ["admin", "refunds", page, limit],
        queryFn: async () => {
            const { data } = await apiClient.get<RefundsResponse>(`/admin/refunds?page=${page}&limit=${limit}`);
            return data;
        }
    });
}

export function useProcessRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string, status: "APPROVED" | "REJECTED" | "COMPLETED" }) => {
            const { data } = await apiClient.patch(`/admin/refunds/${id}`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
            toast.success("Refund status updated.");
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err));
        }
    });
}
