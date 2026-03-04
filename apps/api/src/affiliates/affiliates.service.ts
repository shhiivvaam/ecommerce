import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAffiliateDto } from './dto/affiliate.dto';

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, data: RegisterAffiliateDto) {
    const existingCode = await this.prisma.affiliate.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictException('This affiliate code is already taken');
    }

    const existingAffiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (existingAffiliate) {
      throw new ConflictException('You are already registered as an affiliate');
    }

    return this.prisma.affiliate.create({
      data: {
        userId,
        code: data.code.toUpperCase(),
        commissionRate: 0.05, // 5% flat default
      },
    });
  }

  async getDashboard(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate account not found');
    }

    return affiliate;
  }
}
