import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/orders/[id]
 * Forwards to NestJS GET /orders/:id with admin token.
 */
export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const order = await serverFetch(`/orders/${id}`, { token });
        return NextResponse.json(order);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * PATCH /api/admin/orders/[id]
 * Updates order status. Forwards to NestJS PATCH /orders/:id/status.
 */
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: { status: string } = await request.json();

    try {
        const order = await serverFetch(`/orders/${id}/status`, {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(order);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
