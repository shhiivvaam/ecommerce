import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics/dashboard
 * Forwards to NestJS GET /admin/analytics/dashboard (Admin-only via JWT + RolesGuard).
 */
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await serverFetch("/admin/analytics/dashboard", { token });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
