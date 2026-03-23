"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
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

export interface BulkImportResult {
    importedCount: number;
    failedCount: number;
    total: number;
    errors: Array<{ row: number; reason: string; title?: string }>;
}

export interface BulkCreatePayload {
    products: Array<{
        title: string;
        description: string;
        price: number;
        discounted?: number;
        stock: number;
        categoryId?: string;
        tags?: string[];
        gallery?: string[];
    }>;
}

/**
 * Bulk-create products via POST /api/products/bulk (JSON body).
 * Returns a per-row result summary.
 */
export function useBulkCreateProducts() {
    const queryClient = useQueryClient();

    return useMutation<BulkImportResult, Error, BulkCreatePayload>({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post<BulkImportResult>("/products/bulk", payload);
            return data;
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

/**
 * Upload a CSV or Excel file for bulk product import.
 * Returns a job ID for polling status.
 */
export function useImportProducts() {
    const queryClient = useQueryClient();

    return useMutation<{ jobId: string; message: string }, Error, File>({
        mutationFn: async (file) => {
            const form = new FormData();
            form.append("file", file);
            
            const token = useAuthStore.getState().token;
            const res = await fetch("/api/products/import", {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                    // fetch implicitly sets correct multipart/form-data WITH boundary!
                },
                body: form
            });

            if (!res.ok) {
                let msg = "Upload failed";
                try { const r = await res.json(); msg = r.error || msg; } catch {}
                throw new Error(msg);
            }
            
            return await res.json() as { jobId: string; message: string };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * Poll a file import job's status via GET /api/products/import/:jobId.
 */
export function useImportJobStatus(jobId: string | null) {
    return useQuery<{ id: string; state: string; result?: BulkImportResult; error?: string }>({
        queryKey: ["products", "import-job", jobId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/products/import/${jobId}`);
            return data;
        },
        enabled: Boolean(jobId),
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            if (state === "completed" || state === "failed") return false;
            return 2000; // poll every 2 seconds while pending
        },
    });
}

/**
 * Download the Excel product import template.
 */
export async function downloadProductTemplate(token: string): Promise<void> {
    const response = await fetch("/api/products/template", {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to download template");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

