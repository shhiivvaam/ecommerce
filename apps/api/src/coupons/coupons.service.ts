import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ApplyCouponDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 500);
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async create(data: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing)
      throw new ConflictException('A coupon with this code already exists');

    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        isFlat: data.isFlat ?? false,
        expiryDate: new Date(data.expiryDate),
        usageLimit: data.usageLimit ?? null,
        minTotal: data.minTotal ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateCouponDto) {
    await this.findOne(id);
    const updatePayload: Record<string, unknown> = {};
    if (data.discount !== undefined) updatePayload.discount = data.discount;
    if (data.isFlat !== undefined) updatePayload.isFlat = data.isFlat;
    if (data.expiryDate) updatePayload.expiryDate = new Date(data.expiryDate);
    if (data.usageLimit !== undefined)
      updatePayload.usageLimit = data.usageLimit;
    if (data.minTotal !== undefined) updatePayload.minTotal = data.minTotal;

    return this.prisma.coupon.update({ where: { id }, data: updatePayload });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async apply(dto: ApplyCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) throw new NotFoundException('Coupon code not found');
    if (new Date(coupon.expiryDate) < new Date())
      throw new BadRequestException('This coupon has expired');
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      throw new BadRequestException('This coupon has reached its usage limit');
    if (dto.cartTotal < coupon.minTotal)
      throw new BadRequestException(
        `Minimum order value of $${coupon.minTotal.toFixed(2)} required for this coupon`,
      );

    const discountAmount = coupon.isFlat
      ? Math.min(coupon.discount, dto.cartTotal)
      : (dto.cartTotal * coupon.discount) / 100;

    return {
      couponId: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      isFlat: coupon.isFlat,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalTotal: Math.round((dto.cartTotal - discountAmount) * 100) / 100,
    };
  }
}
