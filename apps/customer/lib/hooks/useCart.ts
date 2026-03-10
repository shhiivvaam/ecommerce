"use client";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import type { CartResponse, CartItem } from "@repo/types";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────────────────── */

/** Maps the backend ApiCartItem shape to the canonical CartItem shape */
function normalizeCart(serverData: {
    items: Array<{
        id: string;
        productId: string;
        variantId?: string;
        quantity: number;
        product: { title: string; price: number; discounted?: number; gallery?: string[] };
        variant?: { size?: string; color?: string; priceDiff: number };
    }>;
    total: number;
}): CartResponse {
    const items: CartItem[] = serverData.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
        title: i.variant
            ? `${i.product.title} (${[i.variant.size, i.variant.color].filter(Boolean).join(", ")})`
            : i.product.title,
        price:
            (i.product.discounted ?? i.product.price) + (i.variant?.priceDiff ?? 0),
        quantity: i.quantity,
        image: i.product.gallery?.[0],
    }));

    return {
        items,
        total: serverData.total,
        itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
    };
}

/* ─── useCart ─────────────────────────────────────────────────────── */

/**
 * Fetches the server-side cart when authenticated.
 * Falls back to the guest Zustand cart when not authenticated.
 */
export function useCart() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const guestCart = useCartStore((s) => ({ items: s.items, total: s.total }));

    const serverCartQuery = useQuery<CartResponse>({
        queryKey: queryKeys.cart.root,
        queryFn: async () => {
            const { data } = await apiClient.get("/cart");
            return normalizeCart(data);
        },
        enabled: isAuthenticated,
        staleTime: 30 * 1000, // cart can change often — 30s stale
    });

    if (!isAuthenticated) {
        return {
            data: {
                items: guestCart.items,
                total: guestCart.total,
                itemCount: guestCart.items.reduce((acc, i) => acc + i.quantity, 0),
            } satisfies CartResponse,
            isLoading: false,
            isError: false,
            error: null,
        };
    }

    return serverCartQuery;
}

/* ─── useAddToCart ────────────────────────────────────────────────── */

export function useAddToCart() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { addItem } = useCartStore();
    const queryClient = useQueryClient();

    return useMutation<
        void,
        Error,
        { productId: string; variantId?: string; quantity: number; title: string; price: number; image?: string }
    >({
        mutationFn: async ({ productId, variantId, quantity }) => {
            if (!isAuthenticated) return; // handled in onMutate (local cart)
            await apiClient.post("/cart/items", { productId, variantId, quantity });
        },
        onMutate: async (item) => {
            if (!isAuthenticated) {
                // Guest cart: update Zustand immediately
                await addItem({
                    productId: item.productId,
                    variantId: item.variantId,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                });
            }
        },
        onSuccess: (_, vars) => {
            if (isAuthenticated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
                toast.success(`${vars.title} added to cart`);
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useRemoveFromCart ───────────────────────────────────────────── */

export function useRemoveFromCart() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { removeItem } = useCartStore();
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            if (!isAuthenticated) {
                await removeItem(id);
                return;
            }
            await apiClient.delete(`/cart/items/${id}`);
        },
        onSuccess: () => {
            if (isAuthenticated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useUpdateCartItem ───────────────────────────────────────────── */

export function useUpdateCartItem() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { updateQuantity } = useCartStore();
    const queryClient = useQueryClient();

    return useMutation<void, Error, { id: string; quantity: number }>({
        mutationFn: async ({ id, quantity }) => {
            if (!isAuthenticated) {
                await updateQuantity(id, quantity);
                return;
            }
            await apiClient.patch(`/cart/items/${id}`, { quantity });
        },
        onSuccess: () => {
            if (isAuthenticated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useClearCart ────────────────────────────────────────────────── */

export function useClearCart() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { clearCart } = useCartStore();
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            if (!isAuthenticated) {
                await clearCart();
                return;
            }
            await apiClient.delete("/cart");
        },
        onSuccess: () => {
            if (isAuthenticated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
