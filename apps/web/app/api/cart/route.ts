import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/cart — fetch authenticated cart
export async function GET(request: Request): Promise<NextResponse> {
    const token = extractToken(request);

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await serverFetch("/cart", { token });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// DELETE /api/cart — clear entire cart
export async function DELETE(request: Request): Promise<NextResponse> {
    const token = extractToken(request);

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await serverFetch("/cart", { method: "DELETE", token });
        return NextResponse.json({ success: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
