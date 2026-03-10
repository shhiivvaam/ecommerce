"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import type { StoreSettings } from "@repo/types";
import toast from "react-hot-toast";

type SettingsPayload = Partial<StoreSettings>;

/**
 * Fetches store settings from /api/admin/settings.
 * Returns the same shape as useSettings() but uses the admin-namespaced cache key
 * and always fetches server-side (no ISR constraint in the hook itself).
 */
export function useAdminSettings() {
    return useQuery<StoreSettings>({
        queryKey: queryKeys.admin.settings,
        queryFn: async () => {
            const { data } = await apiClient.get<StoreSettings>("/admin/settings");
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Mutation to update store settings via PATCH /api/admin/settings.
 * On success, busts both admin and public settings caches.
 */
export function useUpdateAdminSettings() {
    const queryClient = useQueryClient();

    return useMutation<StoreSettings, Error, SettingsPayload>({
        mutationFn: async (payload) => {
            const { data } = await apiClient.patch<StoreSettings>("/admin/settings", payload);
            return data;
        },
        onSuccess: () => {
            // Bust admin cache
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
            // Bust public settings cache so storefront sees new settings
            queryClient.invalidateQueries({ queryKey: queryKeys.settings.root });
            toast.success("Settings saved.");
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
