"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface AdminUser {
    id: string;
    name?: string;
    email: string;
    deletedAt?: string | null;
    createdAt: string;
    role: { name: string };
    _count: { orders: number };
    orders?: Order[];
    addresses?: Address[];
}

interface UsersResponse {
    users: AdminUser[];
    total: number;
}

/**
 * Fetches all users with optional search from /api/admin/users.
 */
export function useAdminUsers(search = "") {
    return useQuery<UsersResponse>({
        queryKey: queryKeys.admin.users(search),
        queryFn: async () => {
            const { data } = await apiClient.get<UsersResponse>("/admin/users", {
                params: { limit: 50, ...(search ? { search } : {}) },
            });
            return data;
        },
        staleTime: 30 * 1000, // 30s
    });
}

/**
 * Fetches a single user's full details from /api/admin/users/[id].
 */
export function useAdminUser(id: string | null) {
    return useQuery<AdminUser>({
        queryKey: queryKeys.admin.user(id ?? ""),
        queryFn: async () => {
            const { data } = await apiClient.get<AdminUser>(`/admin/users/${id}`);
            return data;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Mutation to block or unblock a user.
 * Sends PATCH /api/admin/users/[id]?action=block
 */
export function useToggleUserBlock() {
    const queryClient = useQueryClient();

    return useMutation<AdminUser, Error, { id: string; isBlocked: boolean }>({
        mutationFn: async ({ id }) => {
            const { data } = await apiClient.patch<AdminUser>(
                `/admin/users/${id}?action=block`,
                {},
            );
            return data;
        },
        onSuccess: (updated, { id, isBlocked }) => {
            // Invalidate the user list for all search queries
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success(`Customer ${isBlocked ? "unblocked" : "blocked"}.`);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/**
 * Mutation to update a user's role.
 * Sends PATCH /api/admin/users/[id]?action=role
 */
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation<AdminUser, Error, { id: string; role: string }>({
        mutationFn: async ({ id, role }) => {
            const { data } = await apiClient.patch<AdminUser>(
                `/admin/users/${id}?action=role`,
                { role },
            );
            return data;
        },
        onSuccess: (_, { role }) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success(`Role updated to ${role}.`);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
