import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders?page=1&limit=20
 * Forwards to NestJS GET /orders/admin/all (Admin-only).
 */
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    if (page) params.set("page", page);
    if (limit) params.set("limit", limit);
    const qs = params.toString();

    try {
        const data = await serverFetch(`/orders/admin/all${qs ? `?${qs}` : ""}`, { token });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
