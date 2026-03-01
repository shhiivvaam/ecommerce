import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, data: CreateOrderDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (!data.addressId && !data.address) {
      throw new BadRequestException(
        'Order must specify an addressId or the full address object',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Fetch user email before building the order (avoids Prisma tx type narrowing issues)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const userEmail = user?.email ?? '';

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

        let currentPrice = product.discounted ?? product.price;
        let pTitle = product.title;
        let pSku = product.sku;

        if (item.variantId) {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant)
            throw new BadRequestException(
              `Variant not found for product: ${product.title}`,
            );

          const { count: updatedCount } = await tx.variant.updateMany({
            where: { id: variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (updatedCount === 0) {
            throw new BadRequestException(
              `Insufficient stock for variant of product: ${product.title}`,
            );
          }

          currentPrice += variant.priceDiff;
          pTitle = `${product.title} (${[variant.size, variant.color].filter(Boolean).join(', ')})`;
          pSku = variant.sku || product.sku;
        } else {
          // ✅ Atomic global stock deduction
          const { count: updatedCount } = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (updatedCount === 0) {
            throw new BadRequestException(
              `Insufficient stock for product: ${product.title}`,
            );
          }
        }

        totalAmount += currentPrice * item.quantity;

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: currentPrice,
          productTitle: pTitle,
          sku: pSku,
        });
      }

      // Compute taxes and shipping from Settings
      const settings = await tx.settings.findFirst();
      const taxPercent = settings?.taxPercent || 0;
      const shippingFlat = settings?.shippingFlat || 0;

      const taxAmount = (totalAmount * taxPercent) / 100;
      const shippingAmount = shippingFlat;

      // ✅ Apply coupon discount if a coupon code is provided
      let discountAmount = 0;
      let couponId: string | undefined;

      if (data.couponCode) {
        const coupon = await tx.coupon.findFirst({
          where: { code: data.couponCode.toUpperCase() },
        });

        if (!coupon) {
          throw new BadRequestException(
            `Coupon code "${data.couponCode}" is not valid`,
          );
        }

        if (new Date() > coupon.expiryDate) {
          throw new BadRequestException(
            `Coupon "${data.couponCode}" has expired`,
          );
        }

        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new BadRequestException(
            `Coupon "${data.couponCode}" has reached its usage limit`,
          );
        }

        if (totalAmount < coupon.minTotal) {
          throw new BadRequestException(
            `Order total must be at least $${coupon.minTotal.toFixed(2)} to use this coupon`,
          );
        }

        discountAmount = coupon.isFlat
          ? coupon.discount
          : (totalAmount * coupon.discount) / 100;

        discountAmount = Math.min(discountAmount, totalAmount); // cap at order total
        couponId = coupon.id;

        // Increment usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Resolve address by cloning to prevent silent mutation of past orders
      let finalAddressObj;
      if (data.addressId) {
        const existingAddress = await tx.address.findUnique({
          where: { id: data.addressId },
        });
        if (!existingAddress)
          throw new BadRequestException('Address not found');
        finalAddressObj = {
          userId,
          street: existingAddress.street,
          city: existingAddress.city,
          state: existingAddress.state,
          country: existingAddress.country,
          zipCode: existingAddress.zipCode,
          isDefault: false,
        };
      } else if (data.address) {
        finalAddressObj = {
          userId,
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          country: data.address.country,
          zipCode: data.address.zipCode,
          isDefault: false, // snapshots shouldn't be default
        };
      } else {
        throw new BadRequestException('Address could not be resolved');
      }

      const snapshotAddress = await tx.address.create({
        data: finalAddressObj,
      });
      const createdAddressId = snapshotAddress.id;

      const grandTotal =
        totalAmount + taxAmount + shippingAmount - discountAmount;

      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          totalAmount: Math.max(0, grandTotal),
          taxAmount,
          shippingAmount,
          addressId: createdAddressId,
          couponId: couponId ?? null,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return { order, userEmail };
    });

    // Send confirmation email — fire and forget, only runs if transaction committed successfully
    if (result.userEmail) {
      this.emailService
        .sendOrderConfirmation(
          result.userEmail,
          result.order.id,
          result.order.totalAmount,
        )
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error('Failed to send order email', {
            error: errorMessage,
            orderId: result.order.id,
            userEmail: result.userEmail,
          });
        });
    }

    return result.order;
  }

  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: true, variant: true } },
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

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, limit };
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

    // Restore stock for each item atomically in a transaction
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });
    });
  }
}
