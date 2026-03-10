"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "@repo/types";
import toast from "react-hot-toast";

/**
 * useMe — fetches the current user's profile.
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

            // Sync guest cart to server
            const guestCart = useCartStore.getState();
            if (guestCart.items.length > 0) {
                try {
                    await Promise.all(
                        guestCart.items.map(item =>
                            apiClient.post("/cart/items", {
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity
                            })
                        )
                    );
                    guestCart.clearCart();
                } catch (error) {
                    console.error("Failed to sync guest cart", error);
                }
            }

            // Invalidate cart so it refetches from server after login
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * useRegister — mutation that registers a new user and logs them in.
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

            // Sync guest cart to server
            const guestCart = useCartStore.getState();
            if (guestCart.items.length > 0) {
                try {
                    await Promise.all(
                        guestCart.items.map(item =>
                            apiClient.post("/cart/items", {
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity
                            })
                        )
                    );
                    guestCart.clearCart();
                } catch (error) {
                    console.error("Failed to sync guest cart", error);
                }
            }

            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * useLogout — mutation that clears auth state and query cache.
 */
export function useLogout() {
    const { logout } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            // Best-effort server logout (clears httpOnly cookie if used)
            await apiClient.post("/auth/logout").catch(() => {
                // Ignore errors — local state must always be cleared
            });
        },
        onSettled: () => {
            logout();
            // Clear all user-specific cached data
            queryClient.removeQueries({ queryKey: queryKeys.cart.root });
            queryClient.removeQueries({ queryKey: queryKeys.user.me });
            queryClient.removeQueries({ queryKey: queryKeys.orders.all });
        },
    });
}
