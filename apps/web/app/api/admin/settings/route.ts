import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { StoreSettings } from "@repo/types";

// Public GET is cached — settings rarely change
export const revalidate = 600;

/**
 * GET /api/admin/settings — read settings (public, cached 10 min)
 * PATCH /api/admin/settings — update settings (admin only)
 */
export async function GET(): Promise<NextResponse> {
    try {
        const settings = await serverFetch<StoreSettings>("/settings");
        return NextResponse.json(settings);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const settings = await serverFetch<StoreSettings>("/settings", {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(settings);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
