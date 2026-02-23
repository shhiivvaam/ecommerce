import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateOrderDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const productIds = data.items.map((item) => item.productId);

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'One or more products in the order do not exist',
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.title}`,
          );
        }

        // Use discounted price if available, otherwise regular price
        const currentPrice = product.discounted ?? product.price;
        totalAmount += currentPrice * item.quantity;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: currentPrice,
          productTitle: product.title,
          sku: product.sku,
        });

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
      }

      // Compute eventual taxes and shipping (can be pulled from Settings later)
      const taxAmount = 0;
      const shippingAmount = 0;

      return tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          totalAmount: totalAmount + taxAmount + shippingAmount,
          taxAmount,
          shippingAmount,
          addressId: data.addressId,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
