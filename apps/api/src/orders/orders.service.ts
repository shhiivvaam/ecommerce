import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { ShippingService } from '../shipping/shipping.service';
import { TaxService } from '../tax/tax.service';
import { OrderStatus, RoleType } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';
import { UpdateOrderTrackingDto } from './dto/tracking.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private couponsService: CouponsService,
    private shippingService: ShippingService,
    private taxService: TaxService,
  ) {}

  async create(userId: string | undefined, data: CreateOrderDto) {
    if (!userId && !data.sessionId && !data.guestEmail) {
      throw new BadRequestException(
        'A user ID or (session ID + guest email) must be provided.',
      );
    }
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
      let userEmail = data.guestEmail ?? '';

      if (userId) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        userEmail = user?.email ?? userEmail;
      }

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
      let isDigitalOnly = true;
      const orderItemsData = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        if (!product.isDigital) isDigitalOnly = false;

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

      // Tax and Shipping will be calculated later with the final address

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

        this.couponsService.validateCouponBasic(coupon, totalAmount);

        // Build CouponItem list for discount calculation
        const couponItems = orderItemsData.map((item) => ({
          productId: item.productId,
          categoryId: item.variantId || '', // Simplified for now since Prisma needs categories resolving
          price: item.price,
          quantity: item.quantity,
        }));

        discountAmount = this.couponsService.calculateDiscount(
          coupon,
          couponItems,
          totalAmount,
        );
        couponId = coupon.id;

        // Increment usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Resolve address by cloning to prevent silent mutation of past orders
      let finalAddressObj;
      let createdAddressId = undefined;

      if (!isDigitalOnly) {
        if (data.addressId) {
          const existingAddress = await tx.address.findUnique({
            where: { id: data.addressId },
          });
          if (!existingAddress)
            throw new BadRequestException('Address not found');
          finalAddressObj = {
            userId: userId || undefined,
            sessionId: !userId ? data.sessionId : undefined,
            street: existingAddress.street,
            city: existingAddress.city,
            state: existingAddress.state,
            country: existingAddress.country,
            zipCode: existingAddress.zipCode,
            isDefault: false,
          };
        } else if (data.address) {
          finalAddressObj = {
            userId: userId || undefined,
            sessionId: !userId ? data.sessionId : undefined,
            street: data.address.street,
            city: data.address.city,
            state: data.address.state,
            country: data.address.country,
            zipCode: data.address.zipCode,
            isDefault: false, // snapshots shouldn't be default
          };
        } else {
          throw new BadRequestException(
            'Shipping address is required for physical products',
          );
        }

        const snapshotAddress = await tx.address.create({
          data: finalAddressObj,
        });
        createdAddressId = snapshotAddress.id;
      }

      let taxAmount = 0;
      let shippingAmount = 0;
      if (!isDigitalOnly && finalAddressObj) {
        taxAmount = this.taxService.calculateTaxAmount(
          totalAmount,
          finalAddressObj as unknown as import('@prisma/client').Address,
        );
        shippingAmount = this.shippingService.calculateShippingRate(
          orderItemsData,
          finalAddressObj as unknown as import('@prisma/client').Address,
          totalAmount,
        );
      }

      let grandTotal =
        totalAmount + taxAmount + shippingAmount - discountAmount;

      grandTotal = Math.max(0, grandTotal);

      // Evaluate Affiliate
      let affiliateId: string | undefined = undefined;
      const reqUserId = userId || undefined;
      if (data.affiliateCode) {
        const affiliate = await tx.affiliate.findUnique({
          where: { code: data.affiliateCode.toUpperCase() },
        });

        if (affiliate && affiliate.userId !== reqUserId) {
          // Give 5% off the grandTotal
          const affiliateDiscount = grandTotal * 0.05;
          discountAmount += affiliateDiscount; // keep track globally
          grandTotal -= affiliateDiscount;
          affiliateId = affiliate.id;
        }
      }

      grandTotal = Math.max(0, grandTotal);

      // Evaluate Gift Card
      if (data.giftCardCode && grandTotal > 0) {
        const giftCard = await tx.giftCard.findUnique({
          where: { code: data.giftCardCode.toUpperCase() },
        });

        if (
          !giftCard ||
          (giftCard.expiresAt && giftCard.expiresAt < new Date())
        ) {
          throw new BadRequestException('Invalid or expired gift card code');
        }

        if (giftCard.currentBalance > 0) {
          const allocatable = Math.min(grandTotal, giftCard.currentBalance);
          grandTotal -= allocatable;

          await tx.giftCard.update({
            where: { id: giftCard.id },
            data: { currentBalance: { decrement: allocatable } },
          });
        }
      }

      const order = await tx.order.create({
        data: {
          userId: userId || undefined,
          sessionId: !userId ? data.sessionId : undefined,
          guestEmail: !userId && userEmail ? userEmail : undefined,
          status: OrderStatus.PENDING,
          totalAmount: Math.max(0, grandTotal),
          taxAmount,
          shippingAmount,
          couponId,
          addressId: createdAddressId,
          affiliateId,
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

  async findAllByUser(userId: string | undefined) {
    if (!userId) return [];
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: string,
    userId: string | undefined,
    sessionId?: string,
    role?: RoleType,
  ) {
    if (!userId && !sessionId)
      throw new ForbiddenException('Identification required');

    // Admins can view any order
    const where =
      role === RoleType.ADMIN
        ? { id }
        : userId
          ? { id, userId }
          : { id, sessionId: sessionId! };

    const order = await this.prisma.order.findFirst({
      where,
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

  async cancelOrder(
    id: string,
    userId: string | undefined,
    sessionId?: string,
  ) {
    if (!userId && !sessionId)
      throw new ForbiddenException('Identification required');

    const order = await this.prisma.order.findFirst({
      where: userId ? { id, userId } : { id, sessionId: sessionId! },
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

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
      return { ...updatedOrder, items: order.items };
    });
  }

  async updateTracking(id: string, data: UpdateOrderTrackingDto) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        status: OrderStatus.SHIPPED,
      },
    });

    if (order.guestEmail || order.userId) {
      const email =
        order.guestEmail ||
        (await this.prisma.user.findUnique({ where: { id: order.userId! } }))
          ?.email;
      if (email) {
        this.logger.log(
          `Dispatching email to ${email} for tracking # ${order.trackingNumber}`,
        );
      }
    }

    return order;
  }

  async getTracking(
    id: string,
    userId?: string,
    sessionId?: string,
    role?: RoleType,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Admins can view tracking for any order
    if (role !== RoleType.ADMIN) {
      if (!userId && order.sessionId !== sessionId) {
        throw new ForbiddenException('You do not have access to this order');
      }
      if (userId && order.userId !== userId) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    // Mock Dynamic Timeline based on status
    const timeline = [];
    timeline.push({ status: 'Order Placed', date: order.createdAt });

    if (order.status !== 'PENDING') {
      timeline.push({ status: 'Processing', date: order.updatedAt });
    }

    if (order.trackingNumber) {
      timeline.push({
        status: 'Shipped',
        date: order.updatedAt,
        details: `Carrier: ${order.carrier}, Tracking: ${order.trackingNumber}`,
      });
    }

    if (order.status === 'DELIVERED') {
      timeline.push({
        status: 'Delivered',
        date: order.updatedAt,
        details: 'Package arrived',
      });
    }

    return {
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      status: order.status,
      timeline,
    };
  }

  async getDigitalDownloadUrl(
    orderId: string,
    productId: string,
    userId: string,
    role?: RoleType,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Admins can download from any order
    if (role !== RoleType.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    if (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Order must be paid to access digital products',
      );
    }

    const orderItem = order.items.find((item) => item.productId === productId);
    if (!orderItem) {
      throw new NotFoundException('Product not found in this order');
    }

    if (!orderItem.product.isDigital) {
      throw new BadRequestException('This product is not a digital asset');
    }

    if (!orderItem.product.fileUrl) {
      throw new NotFoundException('Digital asset file not available');
    }

    // In a real application, this might generate an S3 pre-signed URL.
    return {
      downloadUrl: orderItem.product.fileUrl,
    };
  }
}
