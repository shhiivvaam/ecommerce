import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Forwards to NestJS GET /admin/stats (Admin-only via JWT + RolesGuard on backend).
 */
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const stats = await serverFetch("/admin/stats", { token });
        return NextResponse.json(stats);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
