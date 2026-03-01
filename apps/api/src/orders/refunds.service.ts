import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefundsService {
  constructor(private prisma: PrismaService) {}

  async requestRefund(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { refund: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (!['DELIVERED', 'SHIPPED'].includes(order.status)) {
      throw new BadRequestException(
        'Refunds can only be requested for delivered or shipped orders',
      );
    }

    if (order.refund) {
      throw new BadRequestException(
        'A refund has already been requested for this order',
      );
    }

    return this.prisma.refund.create({
      data: {
        orderId,
        amount: order.totalAmount,
        reason: reason ?? null,
        status: 'PENDING',
      },
    });
  }

  async getRefundForOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const refund = await this.prisma.refund.findUnique({ where: { orderId } });
    if (!refund) throw new NotFoundException('No refund found for this order');
    return refund;
  }

  async updateRefundStatus(
    refundId: string,
    status: 'APPROVED' | 'REJECTED' | 'COMPLETED',
  ) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });
    if (!refund) throw new NotFoundException('Refund not found');

    return this.prisma.refund.update({
      where: { id: refundId },
      data: { status },
    });
  }

  async findAll(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const [refunds, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        include: {
          order: {
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.refund.count(),
    ]);

    return { refunds, total, page, limit: safeLimit };
  }
}
