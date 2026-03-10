"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

export interface AffiliateDashboard {
    id: string;
    code: string;
    commissionRate: number;
    totalEarned: number;
    userId: string;
}

export function useAffiliate() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<AffiliateDashboard>({
        queryKey: ["affiliate", "dashboard"],
        queryFn: async () => {
            const { data } = await apiClient.get<AffiliateDashboard>("/affiliates/dashboard");
            return data;
        },
        enabled: isAuthenticated,
        retry: 1, // Don't retry infinitely if they aren't registered
    });
}

export function useRegisterAffiliate() {
    const queryClient = useQueryClient();

    return useMutation<AffiliateDashboard, Error>({
        mutationFn: async () => {
            const { data } = await apiClient.post<AffiliateDashboard>("/affiliates/register");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
            toast.success("Successfully joined the affiliate program!");
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
