import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import { AuthResponse } from "@/types/api-responses";

/**
 * POST /api/auth/reset-password - Reset password with token
 * Forwards to NestJS POST /auth/reset-password
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate input
    if (!body.token || !body.newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Password validation
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for common password patterns
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(body.newPassword.toLowerCase())) {
      return NextResponse.json(
        { error: "Password is too common. Please choose a stronger password." },
        { status: 400 }
      );
    }

    const data = await serverFetch('/auth/reset-password', {
      method: 'POST',
      body: {
        token: body.token.trim(),
        newPassword: body.newPassword
      }
    }) as AuthResponse;

    return NextResponse.json({
      message: "Password has been reset successfully. You can now log in with your new password.",
      success: true,
      ...(data && !data.message && !data.success ? data : {})
    });
  } catch (error) {
    console.error('Reset password error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific error cases
    if (status === 400 && message.includes('token')) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new password reset." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
