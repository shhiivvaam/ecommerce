import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { Product } from "@repo/types";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    const { id } = await params;

    try {
        const product = await serverFetch<Product>(`/products/${id}`);
        return NextResponse.json(product);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
