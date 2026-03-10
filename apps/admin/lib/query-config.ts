import { QueryClient } from "@tanstack/react-query";

/**
 * Factory that creates a QueryClient with production-grade defaults.
 * Called once per page load (server) or once on client mount (via QueryProvider).
 *
 * staleTime:            1 min  – data considered fresh, no background refetch
 * gcTime:               5 min  – inactive query cache kept in memory
 * retry:                1      – retry once on failure (avoids hammering failing API)
 * retryDelay:           exp    – exponential backoff capped at 10s
 * refetchOnWindowFocus: false  – don't spam API when user alt-tabs back
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                gcTime: 5 * 60 * 1000,
                retry: 1,
                retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
                refetchOnWindowFocus: false,
                refetchOnMount: true,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}
