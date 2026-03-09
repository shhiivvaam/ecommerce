import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

/**
 * POST /api/coupons/apply - Apply a coupon code to cart/order
 * Forwards to NestJS POST /coupons/apply
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (!body.code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Clean coupon code
    const couponCode = body.code.toString().trim().toUpperCase();

    if (couponCode.length < 3) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 }
      );
    }

    const data = await serverFetch('/coupons/apply', {
      method: 'POST',
      token,
      body: {
        code: couponCode,
        orderId: body.orderId || null,
        subtotal: body.subtotal || null
      }
    }) as Record<string, unknown>;

    return NextResponse.json({
      message: "Coupon applied successfully",
      ...(data || {})
    });
  } catch (error) {
    console.error('Coupon application error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific coupon error cases
    if (status === 404) {
      return NextResponse.json(
        { error: "Coupon code not found" },
        { status: 404 }
      );
    }

    if (status === 400 && message.includes('expired')) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    if (status === 400 && message.includes('usage')) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    if (status === 400 && message.includes('minimum')) {
      return NextResponse.json(
        { error: "Minimum order amount not met for this coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
