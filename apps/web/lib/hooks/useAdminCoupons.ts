"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";

interface Coupon {
    id: string;
    code: string;
    discount: number;
    isFlat: boolean;
    expiryDate: string;
    usageLimit?: number;
    usedCount: number;
    minTotal: number;
}

interface CouponPayload {
    code: string;
    discount: number;
    isFlat: boolean;
    expiryDate: string;
    usageLimit?: number;
    minTotal: number;
}

/** Fetches all coupons from /api/admin/coupons. */
export function useAdminCoupons() {
    return useQuery<Coupon[]>({
        queryKey: queryKeys.admin.coupons,
        queryFn: async () => {
            const { data } = await apiClient.get<Coupon[]>("/admin/coupons");
            return data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/** Create a new coupon. */
export function useCreateCoupon() {
    const queryClient = useQueryClient();

    return useMutation<Coupon, Error, CouponPayload>({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post<Coupon>("/admin/coupons", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/** Update an existing coupon by ID. */
export function useUpdateCoupon() {
    const queryClient = useQueryClient();

    return useMutation<Coupon, Error, { id: string } & Partial<CouponPayload>>({
        mutationFn: async ({ id, ...payload }) => {
            const { data } = await apiClient.patch<Coupon>(`/admin/coupons/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/** Delete a coupon by ID. */
export function useDeleteCoupon() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await apiClient.delete(`/admin/coupons/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
