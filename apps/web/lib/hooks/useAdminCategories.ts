"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { Category } from "@repo/types";
import toast from "react-hot-toast";

interface CategoryPayload {
    name: string;
    description?: string;
}

/**
 * Fetches all categories via /api/admin/categories.
 * Uses admin-namespaced cache key — separate from the public useCategories cache.
 */
export function useAdminCategories() {
    return useQuery<Category[]>({
        queryKey: queryKeys.admin.categories,
        queryFn: async () => {
            const { data } = await apiClient.get<Category[]>("/admin/categories");
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/** Create a new category. Invalidates admin categories cache on success. */
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation<Category, Error, CategoryPayload>({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post<Category>("/admin/categories", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
            // Also bust the public categories cache so the storefront sees changes
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/** Update an existing category by ID. */
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation<Category, Error, { id: string } & CategoryPayload>({
        mutationFn: async ({ id, ...payload }) => {
            const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/** Delete a category by ID. */
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await apiClient.delete(`/admin/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
