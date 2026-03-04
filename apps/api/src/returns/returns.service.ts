import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReturnRequestDto,
  UpdateReturnRequestStatusDto,
} from './dto/return.dto';
import { ReturnRequestStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async createReturnRequest(
    userId: string,
    orderId: string,
    data: CreateReturnRequestDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { returnRequests: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Can only return orders that have been DELIVERED',
      );
    }

    // Check if there's already an active return request
    const existingActiveReturn = order.returnRequests.find(
      (r) => r.status !== ReturnRequestStatus.REJECTED,
    );

    if (existingActiveReturn) {
      throw new BadRequestException(
        'A return request already exists and is active for this order',
      );
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        reason: data.reason,
        status: ReturnRequestStatus.PENDING,
        refundAmount: order.totalAmount, // Defaut to full amount refund
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.returnRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, totalAmount: true, status: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, data: UpdateReturnRequestStatusDto) {
    const returnReq = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!returnReq) {
      throw new NotFoundException('Return request not found');
    }

    // If marked as REFUNDED, we should also update the Order status if needed
    const updatedReturn = await this.prisma.returnRequest.update({
      where: { id },
      data: { status: data.status as ReturnRequestStatus },
    });

    if (data.status === 'REFUNDED') {
      await this.prisma.order.update({
        where: { id: returnReq.orderId },
        data: { status: OrderStatus.RETURNED },
      });
    }

    return updatedReturn;
  }
}
