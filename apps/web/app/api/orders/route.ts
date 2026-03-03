import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { Order } from "@repo/types";

export const dynamic = "force-dynamic";

// GET /api/orders — list user orders
export async function GET(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const orders = await serverFetch<Order[]>("/orders", { token });
        return NextResponse.json(orders);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// POST /api/orders — create order (checkout)
export async function POST(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const order = await serverFetch<Order>("/orders", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
