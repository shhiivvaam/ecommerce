import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(["ADMIN", "CUSTOMER"]).default("CUSTOMER"),
    avatar: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// ─────────────────────────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────────────────────────
export const CategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    deletedAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    _count: z.object({ products: z.number() }).optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// ─────────────────────────────────────────────────────────────────
// Product Variant
// ─────────────────────────────────────────────────────────────────
export const ProductVariantSchema = z.object({
    id: z.string(),
    size: z.string().optional(),
    color: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number().int().nonnegative(),
    priceDiff: z.number(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// ─────────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────────
export const ProductSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    discounted: z.number().optional(),
    image: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    stock: z.number().int().nonnegative().default(0),
    category: CategorySchema.pick({ id: true, name: true, slug: true }).optional(),
    variants: z.array(ProductVariantSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// A lightweight product type used in lists/cards (no variants/gallery)
export const ProductSummarySchema = ProductSchema.pick({
    id: true,
    title: true,
    description: true,
    price: true,
    discounted: true,
    image: true,
    gallery: true,
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;

// ─────────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────────
export const CartItemSchema = z.object({
    id: z.string(),
    productId: z.string(),
    variantId: z.string().optional(),
    title: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    image: z.string().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// ─────────────────────────────────────────────────────────────────
// Review
// ─────────────────────────────────────────────────────────────────
export const ReviewSchema = z.object({
    id: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    createdAt: z.string(),
    user: z.object({
        id: z.string(),
        name: z.string().optional(),
        avatar: z.string().optional(),
    }),
});

export type Review = z.infer<typeof ReviewSchema>;

// ─────────────────────────────────────────────────────────────────
// API response shapes
// ─────────────────────────────────────────────────────────────────
export interface ApiCartItem {
    id: string;
    productId: string;
    variantId?: string;
    variant?: {
        size?: string;
        color?: string;
        priceDiff: number;
    };
    quantity: number;
    product: {
        title: string;
        price: number;
        discounted?: number;
        gallery?: string[];
    };
}

export interface ProductsApiResponse {
    products?: Product[];
}

// ─────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─────────────────────────────────────────────────────────────────
// Product Filters (used by hooks + BFF routes)
// ─────────────────────────────────────────────────────────────────
export interface ProductFilters {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'createdAt' | 'price' | 'title';
    sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────────
// Banner
// ─────────────────────────────────────────────────────────────────
export interface Banner {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    active: boolean;
    createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Store Settings
// ─────────────────────────────────────────────────────────────────
export interface StoreSettings {
    id: string;
    storeName: string;
    storeMode: 'SINGLE' | 'MULTI';
    currency: string;
    logo?: string;
}

// ─────────────────────────────────────────────────────────────────
// Order
// ─────────────────────────────────────────────────────────────────
export interface OrderItem {
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    title: string;
    image?: string;
}

export interface Order {
    id: string;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    total: number;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}

// ─────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────
export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name?: string;
}

// ─────────────────────────────────────────────────────────────────
// Cart (server response shape)
// ─────────────────────────────────────────────────────────────────
export interface CartResponse {
    items: CartItem[];
    total: number;
    itemCount: number;
}
