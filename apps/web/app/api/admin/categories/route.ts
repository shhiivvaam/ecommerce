import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { Category } from "@repo/types";

// Revalidate every 5 minutes for the public GET
export const revalidate = 300;

/**
 * GET /api/admin/categories — list all categories (public read, cached)
 * POST /api/admin/categories — create category (requires admin token)
 */
export async function GET(): Promise<NextResponse> {
    try {
        const categories = await serverFetch<Category[]>("/categories");
        return NextResponse.json(categories);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const category = await serverFetch<Category>("/categories", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
