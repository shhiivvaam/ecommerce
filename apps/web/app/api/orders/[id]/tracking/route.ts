import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/orders/[id]/tracking - Update order tracking information
 * GET /api/orders/[id]/tracking - Get order tracking information
 * Forwards to NestJS tracking endpoints
 */
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.trackingNumber || !body.carrier) {
      return NextResponse.json(
        { error: "Tracking number and carrier are required" },
        { status: 400 }
      );
    }

    const data = await serverFetch(`/orders/${id}/tracking`, {
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

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await serverFetch(`/orders/${id}/tracking`, { token });

    return NextResponse.json(data);
  } catch (error) {
    const { status, message } = toErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
