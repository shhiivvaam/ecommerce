"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthResponse, LoginCredentials, User } from "@repo/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

/**
 * useMe — fetches the current admin user's profile.
 * Only enabled when the user is authenticated.
 */
export function useMe() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<User>({
        queryKey: queryKeys.user.me,
        queryFn: async () => {
            const { data } = await apiClient.get<User>("/users/me");
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * useLogin — mutation that logs in and updates the auth store.
 * Admin-only: rejects if the API returns a non-admin role.
 */
export function useLogin() {
    const { login } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation<AuthResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
            return data;
        },
        onSuccess: async (data) => {
            login(data.user, data.token);
            // Invalidate any stale user queries
            queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * useLogout — clears admin auth state, calls BFF logout, and redirects to /login.
 */
export function useLogout() {
    const { logout } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            // Tell the BFF to clear the HttpOnly admin-token cookie and call backend
            await apiClient.post("/auth/logout").catch(() => {
                // Ignore errors — local state must always be cleared
            });
        },
        onSettled: () => {
            logout();
            // Clear all cached data
            queryClient.clear();
            router.push("/login");
        },
    });
}
