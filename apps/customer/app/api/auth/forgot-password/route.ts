import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/http";

/**
 * POST /api/auth/forgot-password - Request password reset
 * Forwards to NestJS POST /auth/forgot-password
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    await serverFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email: body.email.toLowerCase().trim() }
    });

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Still return success to prevent email enumeration
    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      success: true
    }, { status: 200 });
  }
}
