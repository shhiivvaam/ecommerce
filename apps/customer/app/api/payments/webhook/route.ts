import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import { headers } from "next/headers";
import { WebhookResponse } from "@/types/api-responses";

/**
 * POST /api/payments/webhook - Handle Stripe webhook events
 * Forwards to NestJS POST /payments/webhook with signature verification
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds for webhook processing

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');
    
    if (!signature) {
      console.error('Webhook Error: Missing stripe-signature header');
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Forward webhook to backend with signature verification
    const data = await serverFetch('/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({ 
        rawBody: body,
        signature,
        headers: Object.fromEntries((await headers()).entries())
      }),
      headers: { 'Content-Type': 'application/json' }
    }) as WebhookResponse;

    // Log successful webhook processing
    console.log('Webhook processed successfully:', { 
      eventType: data?.type,
      eventId: data?.id 
    });

    return NextResponse.json({ 
      received: true,
      ...(data && !data.received ? data : {})
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    const { status, message } = toErrorResponse(error);
    
    // For webhooks, we should still return 200 to prevent Stripe from retrying
    // but log the error for debugging
    if (status >= 400 && status < 500) {
      return NextResponse.json(
        { error: message, webhook_status: 'failed' },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: message, webhook_status: 'failed' },
      { status }
    );
  }
}
