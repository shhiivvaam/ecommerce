/**
 * Centralised query key factory for TanStack Query.
 *
 * WHY: Using string literals like ['products'] scattered across files is fragile.
 * A single factory ensures cache hits/invalidations work correctly everywhere.
 *
 * USAGE:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.cart.root })
 *   useQuery({ queryKey: queryKeys.products.detail(id), ... })
 */

import type { ProductFilters } from "@repo/types";

export const queryKeys = {
    products: {
        all: ["products"] as const,
        lists: () => ["products", "list"] as const,
        list: (filters: ProductFilters) => ["products", "list", filters] as const,
        detail: (id: string) => ["products", id] as const,
    },
    categories: {
        all: ["categories"] as const,
    },
    cart: {
        root: ["cart"] as const,
    },
    orders: {
        all: ["orders"] as const,
        detail: (id: string) => ["orders", id] as const,
    },
    user: {
        me: ["user", "me"] as const,
    },
    settings: {
        root: ["settings"] as const,
    },
    banners: {
        root: ["banners"] as const,
    },
    admin: {
        stats: ["admin", "stats"] as const,
        orders: (page: number, limit: number) => ["admin", "orders", page, limit] as const,
        order: (id: string) => ["admin", "orders", id] as const,
        categories: ["admin", "categories"] as const,
        coupons: ["admin", "coupons"] as const,
        users: (search: string) => ["admin", "users", search] as const,
        user: (id: string) => ["admin", "users", id] as const,
        settings: ["admin", "settings"] as const,
    },
} as const;
