import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse, extractToken } from "@/lib/http";
import type { Product, PaginatedResponse } from "@repo/types";

export const dynamic = "force-dynamic";

interface BackendProductsResponse {
    data?: Product[];
    products?: Product[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);

    // Forward all supported filter params to the backend
    const params = new URLSearchParams();
    const forward = ["page", "limit", "search", "categoryId", "minPrice", "maxPrice", "sortBy", "sortOrder"];
    for (const key of forward) {
        const val = searchParams.get(key);
        if (val) params.set(key, val);
    }

    const qs = params.toString();

    try {
        const raw = await serverFetch<BackendProductsResponse>(
            `/products${qs ? `?${qs}` : ""}`,
            { cache: "no-store" },
        );

        // Normalise: backend may return { data: [] } or { products: [] }
        const products = raw.products ?? raw.data ?? [];
        const total = raw.total ?? products.length;
        const limit = Number(params.get("limit") ?? 20);
        const page = Number(params.get("page") ?? 1);

        const normalized: PaginatedResponse<Product> = {
            data: products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        return NextResponse.json(normalized);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const product = await serverFetch<Product>("/products", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
