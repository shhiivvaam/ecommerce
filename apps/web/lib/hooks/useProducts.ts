"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { Product, ProductFilters, PaginatedResponse } from "@repo/types";
import toast from "react-hot-toast";

/**
 * Fetches a paginated, server-filtered list of products via /api/products.
 * Server handles ALL filtering — no more fetching-all-then-filtering-client-side.
 */
export function useProducts(filters: ProductFilters = {}) {
    return useQuery<PaginatedResponse<Product>>({
        queryKey: queryKeys.products.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.page) params.set("page", String(filters.page));
            if (filters.limit) params.set("limit", String(filters.limit));
            if (filters.search) params.set("search", filters.search);
            if (filters.categoryId) params.set("categoryId", filters.categoryId);
            if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
            if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
            if (filters.sortBy) params.set("sortBy", filters.sortBy);
            if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

            const query = params.toString();
            const { data } = await apiClient.get<PaginatedResponse<Product>>(
                `/products${query ? `?${query}` : ""}`,
            );
            return data;
        },
        placeholderData: (prev) => prev, // keeps previous data visible while next page loads
    });
}

/**
 * Fetches a single product by ID via /api/products/[id].
 */
export function useProduct(id: string | null | undefined) {
    return useQuery<Product>({
        queryKey: queryKeys.products.detail(id ?? ""),
        queryFn: async () => {
            const { data } = await apiClient.get<Product>(`/products/${id}`);
            return data;
        },
        enabled: Boolean(id),
    });
}

/**
 * Deletes a product by ID via DELETE /api/products/[id].
 * Invalidates all product list caches and admin stats on success.
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await apiClient.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
