"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { Banner } from "@repo/types";

/**
 * Fetches active banners from /api/banners.
 */
export function useBanners() {
    return useQuery<Banner[]>({
        queryKey: queryKeys.banners.root,
        queryFn: async () => {
            const { data } = await apiClient.get<Banner[]>("/banners");
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
