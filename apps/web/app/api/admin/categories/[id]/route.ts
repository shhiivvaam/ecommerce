import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { Category } from "@repo/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/categories/[id] — update a category
 * DELETE /api/admin/categories/[id] — delete a category
 */
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    try {
        const category = await serverFetch<Category>(`/categories/${id}`, {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(category);
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
        await serverFetch(`/categories/${id}`, { method: "DELETE", token });
        return NextResponse.json({ success: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
