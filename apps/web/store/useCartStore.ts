import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

export interface CartItem {
    id: string; // Internal cart item id or backend ID
    productId: string;
    variantId?: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
}

interface CartState {
    items: CartItem[];
    total: number;
    addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
}

interface ApiResponseCartItem {
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
    product: {
        title: string;
        price: number;
        discounted?: number;
        gallery?: string[];
    };
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            fetchCart: async () => {
                if (!useAuthStore.getState().isAuthenticated) return;
                try {
                    const { data } = await api.get('/cart');
                    const items = data.items.map((i: ApiResponseCartItem) => ({
                        id: i.id,
                        productId: i.productId,
                        variantId: i.variantId,
                        title: i.product.title,
                        price: i.product.discounted ?? i.product.price,
                        quantity: i.quantity,
                        image: i.product.gallery && i.product.gallery.length > 0 ? i.product.gallery[0] : undefined,
                    }));
                    set({ items, total: data.total });
                } catch (error) {
                    console.error("Failed to fetch remote cart", error);
                }
            },
            addItem: async (newItem) => {
                if (useAuthStore.getState().isAuthenticated) {
                    try {
                        await api.post('/cart/items', {
                            productId: newItem.productId,
                            variantId: newItem.variantId,
                            quantity: newItem.quantity,
                        });
                        await get().fetchCart();
                        return;
                    } catch (error) {
                        console.error('Failed to add item to remote cart', error);
                    }
                }

                // Fallback / Guest
                set((state) => {
                    const existingItem = state.items.find(
                        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
                    );

                    let updatedItems;
                    if (existingItem) {
                        updatedItems = state.items.map((i) =>
                            i.id === existingItem.id
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i
                        );
                    } else {
                        updatedItems = [...state.items, { ...newItem, id: Math.random().toString(36).substring(7) }];
                    }

                    const total = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    return { items: updatedItems, total };
                });
            },
            removeItem: async (id) => {
                if (useAuthStore.getState().isAuthenticated) {
                    try {
                        await api.delete(`/cart/items/${id}`);
                        await get().fetchCart();
                        return;
                    } catch (error) {
                        console.error('Failed to remove remote item', error);
                    }
                }

                set((state) => {
                    const updatedItems = state.items.filter((i) => i.id !== id);
                    const total = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    return { items: updatedItems, total };
                });
            },
            updateQuantity: async (id, quantity) => {
                if (useAuthStore.getState().isAuthenticated) {
                    try {
                        await api.patch(`/cart/items/${id}`, { quantity });
                        await get().fetchCart();
                        return;
                    } catch (error) {
                        console.error('Failed to update remote item', error);
                    }
                }

                set((state) => {
                    const updatedItems = state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    );
                    const total = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    return { items: updatedItems, total };
                });
            },
            clearCart: async () => {
                if (useAuthStore.getState().isAuthenticated) {
                    try {
                        await api.delete('/cart');
                        await get().fetchCart();
                        return;
                    } catch (error) {
                        console.error('Failed to clear remote cart', error);
                    }
                }
                set({ items: [], total: 0 });
            },
        }),
        {
            name: 'ecommerce-cart',
            // Do not persist these remote logic functions, but only local items
            partialize: (state) => ({ items: state.items, total: state.total }),
        }
    )
);
