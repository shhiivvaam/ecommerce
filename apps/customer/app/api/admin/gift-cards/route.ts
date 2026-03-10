import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await serverFetch("/admin/gift-cards", { token });
        return NextResponse.json(data);
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
        const data = await serverFetch("/admin/gift-cards", {
            method: "POST",
            body,
            token,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
