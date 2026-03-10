import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_LIVE_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_LIVE_SECRET');
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if ((!keyId || !keySecret) && isProduction) {
      throw new InternalServerErrorException(
        'Razorpay keys are required in production. Set them in your environment.',
      );
    }

    this.razorpay = new Razorpay({
      key_id: keyId ?? 'rzp_test_placeholder',
      key_secret: keySecret ?? 'test_secret_placeholder',
    });
  }

  async createRazorpayOrder(
    orderId: string,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_LIVE_KEY_ID');
    if (!keyId && this.configService.get('NODE_ENV') === 'production') {
      throw new ForbiddenException(
        'Payment processing is not configured. Please contact support.',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const totalAmount = Number(order.totalAmount);

    const options = {
      amount: Math.round(totalAmount * 100), // amount in the smallest currency unit
      currency: 'INR',
      receipt: orderId,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return { id: order.id, amount: order.amount, currency: order.currency };
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw new InternalServerErrorException('Failed to create Razorpay order');
    }
  }

  async verifyPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_LIVE_SECRET') ?? 'test_secret_placeholder';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new BadRequestException('Invalid signature');
    }

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
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.COMPLETED,
        transactionId: razorpayPaymentId,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    if (order.affiliateId) {
      const affiliate = await this.prisma.affiliate.findUnique({
        where: { id: order.affiliateId },
      });
      if (affiliate) {
        const commission = order.totalAmount * affiliate.commissionRate;
        await this.prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { totalEarned: { increment: commission } },
        });
      }
    }

    return payment;
  }
}

