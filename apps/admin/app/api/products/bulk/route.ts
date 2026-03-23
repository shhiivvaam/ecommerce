import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse, extractToken } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await serverFetch("/products/bulk", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
