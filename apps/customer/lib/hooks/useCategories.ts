"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { Category } from "@repo/types";

/**
 * Fetches all categories from the BFF route /api/categories.
 * staleTime: 5 min — categories rarely change, avoid redundant fetches.
 */
export function useCategories() {
    return useQuery<Category[]>({
        queryKey: queryKeys.categories.all,
        queryFn: async () => {
            const { data } = await apiClient.get<Category[]>("/categories");
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
