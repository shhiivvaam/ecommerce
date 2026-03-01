import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if (!stripeKey && isProduction) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is required in production. Set it in your environment.',
      );
    }

    // In development, fall back to a placeholder — real payments won't work
    // but the API will boot successfully for local dev without Stripe keys.
    this.stripe = new Stripe(stripeKey ?? 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
    });
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
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new ForbiddenException(
        'Payment processing is not configured. Please contact support.',
      );
    }

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
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    if (!endpointSecret) {
      throw new ForbiddenException('Stripe webhook secret is not configured.');
    }
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
    // Idempotency: if payment already exists for this order, ignore
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

    // ✅ Use enum instead of raw string
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    return payment;
  }
}
