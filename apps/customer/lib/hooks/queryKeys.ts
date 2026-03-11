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
    reviews: {
        product: (id: string) => ["reviews", id] as const,
    },
    settings: {
        root: ["settings"] as const,
    },
    affiliate: {
        dashboard: ["affiliate", "dashboard"] as const,
    },
};
