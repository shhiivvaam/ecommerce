"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "@repo/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

/**
 * useMe — fetches the current customer's profile.
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
 * useLogin — mutation that logs in a CUSTOMER and updates the auth store.
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

            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
            queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * useRegister — mutation that registers a new customer and logs them in.
 */
export function useRegister() {
    const { login } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation<AuthResponse, Error, RegisterCredentials>({
        mutationFn: async (credentials) => {
            const { data } = await apiClient.post<AuthResponse>("/auth/register", credentials);
            return data;
        },
        onSuccess: async (data) => {
            login(data.user, data.token);

            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * useLogout — clears customer auth state and calls BFF to clear the HttpOnly cookie.
 */
export function useLogout() {
    const { logout } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            // Call BFF — clears the HttpOnly customer-token cookie on the server
            await apiClient.post("/auth/logout").catch(() => {
                // Ignore errors — local state must always be cleared
            });
        },
        onSettled: () => {
            logout();
            // Clear user-specific cached data
            queryClient.removeQueries({ queryKey: queryKeys.cart.root });
            queryClient.removeQueries({ queryKey: queryKeys.user.me });
            queryClient.removeQueries({ queryKey: queryKeys.orders.all });
            router.push("/login");
        },
    });
}
