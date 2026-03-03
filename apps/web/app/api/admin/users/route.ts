import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users?search=X&limit=50 — list all users (admin)
 */
export async function GET(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    if (search) params.set("search", search);
    if (limit) params.set("limit", limit);
    const qs = params.toString();

    try {
        const data = await serverFetch(`/users${qs ? `?${qs}` : ""}`, { token });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
