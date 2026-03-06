import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/cart/items/[id] — update quantity
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: { quantity: number } = await request.json();

    try {
        const data = await serverFetch(`/cart/items/${id}`, {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// DELETE /api/cart/items/[id] — remove item
export async function DELETE(request: Request, { params }: Params): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        await serverFetch(`/cart/items/${id}`, { method: "DELETE", token });
        return NextResponse.json({ success: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
