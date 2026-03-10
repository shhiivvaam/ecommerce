import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/coupons — list all coupons (admin)
 * POST /api/admin/coupons — create a coupon (admin)
 */
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const coupons = await serverFetch("/coupons", { token });
        return NextResponse.json(coupons);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const coupon = await serverFetch("/coupons", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(coupon, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
