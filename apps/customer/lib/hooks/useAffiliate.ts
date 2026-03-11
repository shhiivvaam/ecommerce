"use client";

import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

export interface Affiliate {
    id: string;
    userId: string;
    code: string;
    commissionRate: number;
    totalEarned: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useAffiliate() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<Affiliate | undefined>({
        queryKey: queryKeys.affiliate.dashboard,
        queryFn: async () => {
            try {
                const { data } = await apiClient.get<Affiliate>("/affiliates/dashboard");
                return data;
            } catch (error: unknown) {
                // If it's a 404 or similar, it means they are not registered yet
                if (axios.isAxiosError(error)) {
                    const status = error.response?.status;
                    if (status === 404 || status === 400) {
                        return undefined;
                    }
                }
                throw error;
            }
        },
        enabled: isAuthenticated,
        retry: false,
    });
}

export function useRegisterAffiliate() {
    const queryClient = useQueryClient();

    return useMutation<Affiliate, Error, void>({
        mutationFn: async () => {
            const randomCode = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data } = await apiClient.post<Affiliate>("/affiliates/register", { code: randomCode });
            return data;
        },
        onSuccess: () => {
            toast.success("Successfully registered for the affiliate program!");
            queryClient.invalidateQueries({ queryKey: queryKeys.affiliate.dashboard });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
