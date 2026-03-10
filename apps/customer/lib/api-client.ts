"use client";

/**
 * Client-side axios instance for calling the BFF layer (/api/*).
 * NEVER calls the NestJS backend directly — all traffic goes through Next.js BFF routes.
 *
 * Auth interceptor: reads token from Zustand store (localStorage) and attaches it.
 * Response interceptor: on 401, clears auth store (token expired / revoked).
 */

import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export const apiClient = axios.create({
    // BFF routes are same-origin, so baseURL is just the path prefix
    baseURL: "/api",
    timeout: 15_000, // 15s — slightly higher than server-side (accounts for BFF overhead)
    headers: {
        "Content-Type": "application/json",
    },
});

// ── Request interceptor ────────────────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Only auto-logout on 401 from session-critical endpoints.
        // Firing logout on ALL 401s causes race conditions during Zustand
        // hydration (token not yet attached) and destroys admin sessions on
        // unrelated 401 responses (e.g. analytics, unauthenticated endpoints).
        const url = error.config?.url ?? "";
        const isSessionEndpoint =
            url.includes("/users/me") || url.includes("/auth/");
        if (error.response?.status === 401 && isSessionEndpoint) {
            // Token is invalid / expired — clear local auth state.
            // Do NOT hard-redirect here: let the layout guards (admin/layout.tsx,
            // dashboard/layout.tsx) handle the redirect so we avoid races.
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    },
);

// ── Typed helper to extract error message from Axios errors ────────
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string | string[] } | undefined;
        if (data?.message) {
            return Array.isArray(data.message)
                ? data.message.join(", ")
                : data.message;
        }
        return error.message;
    }
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
}

// Keep the old named export for backwards compatibility during migration
export { apiClient as api };
