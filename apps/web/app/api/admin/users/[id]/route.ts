import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id] — get single user details (admin)
 */
export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const user = await serverFetch(`/users/${id}`, { token });
        return NextResponse.json(user);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * PATCH /api/admin/users/[id]
 * Routes to different NestJS endpoints based on `action` query param:
 *   ?action=block  → PATCH /users/:id/block
 *   ?action=role   → PATCH /users/:id/role  (body: { role: string })
 */
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json().catch(() => ({}));

    let nestPath: string;
    if (action === "block") {
        nestPath = `/users/${id}/block`;
    } else if (action === "role") {
        nestPath = `/users/${id}/role`;
    } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    try {
        const user = await serverFetch(nestPath, { method: "PATCH", token, body });
        return NextResponse.json(user);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
