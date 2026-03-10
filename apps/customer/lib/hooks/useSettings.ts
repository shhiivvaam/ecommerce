"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { StoreSettings } from "@repo/types";

/**
 * Fetches store settings from /api/settings.
 * staleTime: Infinity — settings almost never change at runtime.
 * Refetch only on explicit invalidation (e.g., after admin update).
 */
export function useSettings() {
    return useQuery<StoreSettings>({
        queryKey: queryKeys.settings.root,
        queryFn: async () => {
            const { data } = await apiClient.get<StoreSettings>("/settings");
            return data;
        },
        staleTime: Infinity,
        retry: 2,
    });
}
