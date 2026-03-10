import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(["SUPERADMIN", "ADMIN", "EDITOR", "SUPPORT", "CUSTOMER"]).default("CUSTOMER"),
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

// ─────────────────────────────────────────────────────────────────
// Address
// ─────────────────────────────────────────────────────────────────
export interface Address {
    id: string;
    userId?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// Wishlist
// ─────────────────────────────────────────────────────────────────
export interface WishlistItem {
    id: string;
    userId: string;
    productId: string;
    product: Product;
    createdAt: string;
}

export interface WishlistCheckResponse {
    inWishlist: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Order Management
// ─────────────────────────────────────────────────────────────────
export interface OrderTracking {
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderCancellation {
    reason?: string;
    refundAmount?: number;
    cancelledAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Password Reset
// ─────────────────────────────────────────────────────────────────
export interface PasswordResetRequest {
    email: string;
}

export interface PasswordReset {
    token: string;
    newPassword: string;
}

// ─────────────────────────────────────────────────────────────────
// Coupon Management
// ─────────────────────────────────────────────────────────────────
export interface CouponApplication {
    code: string;
    orderId?: string;
    subtotal?: number;
}

export interface CouponResponse {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    discountValue: number;
    minimumAmount?: number;
    isValid: boolean;
    message?: string;
}

// ─────────────────────────────────────────────────────────────────
// Gift Cards
// ─────────────────────────────────────────────────────────────────
export interface GiftCardBalance {
    code: string;
    balance: number;
    currency: string;
    status: 'active' | 'expired' | 'used';
    expiresAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// File Upload
// ─────────────────────────────────────────────────────────────────
export interface FileUpload {
    file: string; // base64 encoded
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    folder?: string;
    isPublic?: boolean;
    fileType?: string;
}

export interface FileUploadResponse {
    message: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    folder: string;
    url: string;
    publicUrl?: string;
    fileId: string;
}

// ─────────────────────────────────────────────────────────────────
// Product Import/Export
// ─────────────────────────────────────────────────────────────────
export interface ProductImportResponse {
    message: string;
    imported: number;
    failed: number;
    errors: string[];
    totalProcessed: number;
}

export interface ProductExportResponse {
    message: string;
    filename: string;
    downloadUrl?: string;
    recordCount: number;
    format: 'csv' | 'xlsx';
}

// ─────────────────────────────────────────────────────────────────
// Health Checks
// ─────────────────────────────────────────────────────────────────
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'alive' | 'dead' | 'ready' | 'not-ready';
    timestamp: string;
    service: string;
    uptime: number;
    error?: string;
    memory?: NodeJS.MemoryUsage;
    checks?: {
        backend: boolean;
        database: boolean;
        redis: boolean;
    };
}

export interface Metrics {
    service: string;
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    version: string;
    nodeVersion: string;
    platform: string;
    arch: string;
}

// ─────────────────────────────────────────────────────────────────
// Payment Webhook
// ─────────────────────────────────────────────────────────────────
export interface PaymentWebhook {
    rawBody: string;
    signature: string;
    headers: Record<string, string>;
    type?: string;
    id?: string;
}
