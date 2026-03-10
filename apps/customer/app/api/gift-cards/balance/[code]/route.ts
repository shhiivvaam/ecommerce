import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";

interface Params {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/gift-cards/balance/[code] - Check gift card balance
 * Forwards to NestJS GET /gift-cards/balance/:code
 */
export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const { code } = await params;

    // Validate gift card code
    if (!code || code.length < 6) {
      return NextResponse.json(
        { error: "Invalid gift card code" },
        { status: 400 }
      );
    }

    // Clean and normalize the code
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const data = await serverFetch(`/gift-cards/balance/${cleanCode}`) as Record<string, unknown>;

    return NextResponse.json({
      code: cleanCode,
      balance: data?.balance,
      currency: data?.currency || 'USD',
      status: data?.status || 'active',
      ...(data || {})
    });
  } catch (error) {
    console.error('Gift card balance check error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific gift card error cases
    if (status === 404) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    if (status === 400 && message.includes('expired')) {
      return NextResponse.json(
        { error: "This gift card has expired" },
        { status: 400 }
      );
    }

    if (status === 400 && message.includes('used')) {
      return NextResponse.json(
        { error: "This gift card has been fully used" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
