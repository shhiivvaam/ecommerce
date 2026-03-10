import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> },
): Promise<NextResponse> {
    const { id, variantId } = await params;

    try {
        const data = await serverFetch(`/products/${id}/variants/${variantId}`);
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> },
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, variantId } = await params;

    try {
        const body = await request.json();
        const data = await serverFetch(`/products/${id}/variants/${variantId}`, {
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> },
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, variantId } = await params;

    try {
        const data = await serverFetch(`/products/${id}/variants/${variantId}`, {
            method: "DELETE",
            token,
        });
        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
