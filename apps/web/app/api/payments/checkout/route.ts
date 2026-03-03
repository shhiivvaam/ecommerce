import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

// POST /api/payments/checkout — create a Stripe checkout session
export async function POST(request: Request): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const session = await serverFetch<{ url: string; sessionId: string }>(
            "/payments/checkout",
            { method: "POST", token, body },
        );
        return NextResponse.json(session);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
