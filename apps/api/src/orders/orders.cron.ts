import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async handleAbandonedCheckouts() {
    this.logger.debug('Running abandoned checkouts cleanup cron...');

    // Find PENDING orders older than 30 minutes
    const thresholdDate = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: thresholdDate,
        },
      },
      include: {
        items: true,
      },
    });

    if (abandonedOrders.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${abandonedOrders.length} abandoned orders. Canceling and restoring stock...`,
    );

    for (const order of abandonedOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Restore stock
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

          // Update order status
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
          });
        });

        this.logger.debug(
          `Successfully canceled order ${order.id} and restored stock.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to cancel abandoned order ${order.id}:`,
          error,
        );
      }
    }
  }
}
