import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse, extractToken } from "@/lib/http";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
    const { productId } = await params;
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await serverFetch<any>(`/wishlist/${productId}`, {
            method: "POST",
            token,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
    const { productId } = await params;
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await serverFetch<any>(`/wishlist/${productId}`, {
            method: "DELETE",
            token,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
