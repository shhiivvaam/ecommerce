import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/orders/[id]/cancel - Cancel an order
 * Forwards to NestJS PATCH /orders/:id/cancel
 */
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const data = await serverFetch(`/orders/${id}/cancel`, {
      method: "PATCH",
      token,
      body,
    });

    return NextResponse.json(data);
  } catch (error) {
    const { status, message } = toErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
