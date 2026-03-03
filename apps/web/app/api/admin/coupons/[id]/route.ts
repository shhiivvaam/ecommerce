import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/coupons/[id] — update a coupon
 * DELETE /api/admin/coupons/[id] — delete a coupon
 */
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    try {
        const coupon = await serverFetch(`/coupons/${id}`, {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(coupon);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(request: Request, { params }: Params): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        await serverFetch(`/coupons/${id}`, { method: "DELETE", token });
        return NextResponse.json({ success: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
