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
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
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
