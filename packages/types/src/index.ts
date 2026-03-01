import { z } from "zod";

export const ProductSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    discounted: z.number().optional(),
    gallery: z.array(z.string()).default([]),
    stock: z.number().int().nonnegative().default(0),
    categoryId: z.string().uuid().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
    avatar: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
