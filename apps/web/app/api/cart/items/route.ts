import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

// POST /api/cart/items — add item to cart
export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body: { productId: string; variantId?: string; quantity: number } =
            await request.json();

        const data = await serverFetch("/cart/items", {
            method: "POST",
            token,
            body,
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
