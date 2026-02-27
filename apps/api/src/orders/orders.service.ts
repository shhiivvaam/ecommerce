import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  async create(userId: string, data: CreateOrderDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (!data.addressId && !data.address) {
      throw new BadRequestException(
        'Order must specify an addressId or the full address object',
      );
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
      const settings = await tx.settings.findFirst();
      const taxPercent = settings?.taxPercent || 0;
      const shippingFlat = settings?.shippingFlat || 0;

      const taxAmount = (totalAmount * taxPercent) / 100;
      const shippingAmount = shippingFlat;

      let createdAddressId = data.addressId;

      if (!createdAddressId && data.address) {
        const newAddress = await tx.address.create({
          data: {
            userId,
            street: data.address.street,
            city: data.address.city,
            state: data.address.state,
            country: data.address.country,
            zipCode: data.address.zipCode,
          },
        });
        createdAddressId = newAddress.id;
      }

      if (!createdAddressId) {
        throw new BadRequestException('Address could not be resolved');
      }

      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          totalAmount: totalAmount + taxAmount + shippingAmount,
          taxAmount,
          shippingAmount,
          addressId: createdAddressId,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true, user: true },
      });

      // Send confirmation email (async call, don't wait for it if not critical, but here we can)
      this.emailService
        .sendOrderConfirmation(order.user.email, order.id, order.totalAmount)
        .catch((err) => console.error('Failed to send order email:', err));

      return order;
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

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new ForbiddenException(
        `Cannot cancel an order with status: ${order.status}. Only PENDING or PROCESSING orders can be cancelled.`,
      );
    }

    // Restore stock for each item in a transaction
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });
    });
  }
}
