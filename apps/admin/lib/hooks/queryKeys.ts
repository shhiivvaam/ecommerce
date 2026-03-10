export const queryKeys = {
    auth: {
        profile: ["auth", "profile"] as const,
    },
    user: {
        me: ["user", "me"] as const,
    },
    products: {
        all: ["products"] as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list: (filters: any) => ["products", "list", filters] as const,
        detail: (id: string) => ["products", id] as const,
        categories: ["categories"] as const,
    },
    categories: {
        all: ["categories"] as const,
    },
    banners: {
        root: ["banners"] as const,
    },
    cart: {
        root: ["cart"] as const,
    },
    orders: {
        all: ["orders"] as const,
        detail: (id: string) => ["orders", id] as const,
    },
    wishlist: {
        all: ["wishlist"] as const,
    },
    address: {
        all: ["address"] as const,
    },
    affiliate: {
        dashboard: ["affiliate", "dashboard"] as const,
    },
    admin: {
        // sub-resource caches — namespaced so they don't collide with public caches
        categories: ["admin", "categories"] as const,
        stats: ["admin", "stats"] as const,
        settings: ["admin", "settings"] as const,
        giftCards: ["admin", "gift-cards"] as const,
        coupons: ["admin", "coupons"] as const,
        users: (search = "") => ["admin", "users", search] as const,
        user: (id: string) => ["admin", "users", id] as const,
        orders: (page = 1, limit = 20) => ["admin", "orders", page, limit] as const,
        returns: ["admin", "returns"] as const,
    },
    settings: {
        root: ["settings"] as const,
    },
};
