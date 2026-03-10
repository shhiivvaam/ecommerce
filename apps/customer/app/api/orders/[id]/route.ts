import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { Order } from "@repo/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/[id]
export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const order = await serverFetch<Order>(`/orders/${id}`, { token });
        return NextResponse.json(order);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
