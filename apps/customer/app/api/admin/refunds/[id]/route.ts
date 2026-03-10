import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const body = await request.json();
        const data = await serverFetch(`/orders/refunds/${id}/status`, {
            method: "PATCH",
            body,
            token,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
