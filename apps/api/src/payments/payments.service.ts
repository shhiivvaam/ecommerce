import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock',
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        apiVersion: '2023-10-16' as any,
      } as Stripe.StripeConfig,
    );
  }

  async createCheckoutSession(
    orderId: string,
    items: {
      product?: { title?: string };
      title?: string;
      price: number;
      quantity: number;
    }[],
    successUrl: string,
    cancelUrl: string,
  ) {
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product?.title || item.title || 'Product Item',
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: orderId,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  constructEvent(payload: string | Buffer, signature: string) {
    const endpointSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_test';
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Error';
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }
  }

  async verifyPayment(
    orderId: string,
    transactionId: string,
    method: PaymentMethod = PaymentMethod.STRIPE,
  ) {
    // Check for idempotency: if payment already exists for this order, ignore
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        method,
        status: PaymentStatus.COMPLETED,
        transactionId,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    return payment;
  }
}
