"use client";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";
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
 * Fetches the server-side cart. Requires authentication — the API will
 * return 401 for unauthenticated requests, which is handled gracefully.
 */
export function useCart() {
    return useQuery<CartResponse>({
        queryKey: queryKeys.cart.root,
        queryFn: async () => {
            const { data } = await apiClient.get("/cart");
            return normalizeCart(data);
        },
        staleTime: 30 * 1000,
        // Return an empty cart shape on error (e.g. 401) rather than throwing
        meta: { suppressError: true },
    });
}

/* ─── useAddToCart ────────────────────────────────────────────────── */

export function useAddToCart() {
    const queryClient = useQueryClient();

    return useMutation<
        void,
        Error,
        { productId: string; variantId?: string; quantity: number; title: string; price: number; image?: string }
    >({
        mutationFn: async ({ productId, variantId, quantity }) => {
            await apiClient.post("/cart/items", { productId, variantId, quantity });
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
            toast.success(`${vars.title} added to cart`);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useRemoveFromCart ───────────────────────────────────────────── */

export function useRemoveFromCart() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await apiClient.delete(`/cart/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useUpdateCartItem ───────────────────────────────────────────── */

export function useUpdateCartItem() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { id: string; quantity: number }>({
        mutationFn: async ({ id, quantity }) => {
            await apiClient.patch(`/cart/items/${id}`, { quantity });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

/* ─── useClearCart ────────────────────────────────────────────────── */

export function useClearCart() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            await apiClient.delete("/cart");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}
