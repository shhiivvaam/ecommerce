import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseGiftCardDto } from './dto/gift-card.dto';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  async purchase(data: PurchaseGiftCardDto) {
    // Generate a secure alphanumeric code
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();

    // Default expiration: 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return this.prisma.giftCard.create({
      data: {
        code,
        initialBalance: data.amount,
        currentBalance: data.amount,
        expiresAt,
      },
    });
  }

  async getBalance(code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      select: { currentBalance: true, expiresAt: true, initialBalance: true },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      throw new BadRequestException('Gift card has expired');
    }

    return giftCard;
  }
}
