import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse, extractToken } from "@/lib/http";
import { Review } from "@repo/types";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    const { id } = await params;

    try {
        const data = await serverFetch<Review[]>(`/products/${id}/reviews`);
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    const { id } = await params;
    const token = await extractToken(request);

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const data = await serverFetch<Review>(`/products/${id}/reviews`, {
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
