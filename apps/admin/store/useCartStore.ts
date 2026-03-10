import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@repo/types';

export type { CartItem };

/**
 * Guest cart store — persisted to localStorage for unauthenticated users.
 *
 * IMPORTANT: When the user is authenticated, cart is managed by TanStack Query
 * (see lib/hooks/useCart.ts). This store is ONLY the fallback for guests.
 * On login, the cart contents should be merged into the server cart.
 */
interface GuestCartState {
    items: CartItem[];
    total: number;
    addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
}

export const useCartStore = create<GuestCartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,

            addItem: async (newItem) => {
                set((state) => {
                    const existing = state.items.find(
                        (i) =>
                            i.productId === newItem.productId &&
                            i.variantId === newItem.variantId,
                    );

                    const updatedItems = existing
                        ? state.items.map((i) =>
                            i.id === existing.id
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i,
                        )
                        : [
                            ...state.items,
                            {
                                ...newItem,
                                id: Math.random().toString(36).substring(7),
                            },
                        ];

                    return {
                        items: updatedItems,
                        total: updatedItems.reduce(
                            (acc, i) => acc + i.price * i.quantity,
                            0,
                        ),
                    };
                });
            },

            removeItem: async (id) => {
                set((state) => {
                    const updatedItems = state.items.filter((i) => i.id !== id);
                    return {
                        items: updatedItems,
                        total: updatedItems.reduce(
                            (acc, i) => acc + i.price * i.quantity,
                            0,
                        ),
                    };
                });
            },

            updateQuantity: async (id, quantity) => {
                set((state) => {
                    const updatedItems = state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i,
                    );
                    return {
                        items: updatedItems,
                        total: updatedItems.reduce(
                            (acc, i) => acc + i.price * i.quantity,
                            0,
                        ),
                    };
                });
            },

            clearCart: async () => {
                set({ items: [], total: 0 });
            },

            /** Snapshot of current guest cart for merging on login */
            get snapshot() {
                return get().items;
            },
        }),
        {
            name: 'ecommerce-cart',
            partialize: (state) => ({ items: state.items, total: state.total }),
        },
    ),
);
