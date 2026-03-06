import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

// PATCH /api/addresses/[id] — update an address
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await request.json();
        const address = await serverFetch<any>(`/addresses/${id}`, {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(address);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// DELETE /api/addresses/[id] — delete an address
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        // 204 No Content response support
        await serverFetch(`/addresses/${id}`, {
            method: "DELETE",
            token,
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
