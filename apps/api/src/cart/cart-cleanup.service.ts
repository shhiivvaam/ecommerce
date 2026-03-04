import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    try {
      const { count } = await this.prisma.cartItem.deleteMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      });

      if (count > 0) {
        this.logger.log(`Released ${count} expired cart items.`);
      }
    } catch (e) {
      this.logger.error('Failed to cleanup expired cart reservations', e);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedCarts() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const abandonedCarts = await this.prisma.cart.findMany({
        where: {
          updatedAt: { lte: twentyFourHoursAgo },
          recoveryEmailSent: false,
          items: { some: {} },
        },
        include: {
          user: true,
          items: { include: { product: true } },
        },
      });

      for (const cart of abandonedCarts) {
        if (cart.user?.email) {
          await this.emailService.sendAbandonedCartEmail(
            cart.user.email,
            cart.id,
            cart.total,
          );

          await this.prisma.cart.update({
            where: { id: cart.id },
            data: { recoveryEmailSent: true },
          });

          this.logger.log(
            `Sent abandoned cart recovery email to user: ${cart.userId}`,
          );
        }
      }
    } catch (e) {
      this.logger.error('Failed to process abandoned carts', e);
    }
  }
}
