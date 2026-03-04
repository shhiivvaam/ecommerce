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
import { Coupon, CouponType } from '@prisma/client';

export interface CouponItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

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
        type: data.type || CouponType.PERCENTAGE,
        discount: data.discount,
        expiryDate: new Date(data.expiryDate),
        usageLimit: data.usageLimit ?? null,
        minTotal: data.minTotal ?? 0,
        applicableProductIds: data.applicableProductIds ?? [],
        applicableCategoryIds: data.applicableCategoryIds ?? [],
        buyQuantity: data.buyQuantity ?? null,
        getQuantity: data.getQuantity ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCouponDto) {
    await this.findOne(id);
    const updatePayload: Record<string, unknown> = {};
    if (data.discount !== undefined) updatePayload.discount = data.discount;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.expiryDate) updatePayload.expiryDate = new Date(data.expiryDate);
    if (data.usageLimit !== undefined)
      updatePayload.usageLimit = data.usageLimit;
    if (data.minTotal !== undefined) updatePayload.minTotal = data.minTotal;
    if (data.applicableProductIds !== undefined)
      updatePayload.applicableProductIds = data.applicableProductIds;
    if (data.applicableCategoryIds !== undefined)
      updatePayload.applicableCategoryIds = data.applicableCategoryIds;
    if (data.buyQuantity !== undefined)
      updatePayload.buyQuantity = data.buyQuantity;
    if (data.getQuantity !== undefined)
      updatePayload.getQuantity = data.getQuantity;

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
    this.validateCouponBasic(coupon, dto.cartTotal);

    const discountAmount = this.calculateDiscount(coupon, [], dto.cartTotal); // Empty items for simple fallback calculation

    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      discountAmount: discountAmount,
      finalTotal: Math.round((dto.cartTotal - discountAmount) * 100) / 100,
    };
  }

  validateCouponBasic(coupon: Coupon, cartTotal: number) {
    if (new Date(coupon.expiryDate) < new Date())
      throw new BadRequestException(`Coupon "${coupon.code}" has expired`);
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      throw new BadRequestException(
        `Coupon "${coupon.code}" has reached its usage limit`,
      );
    if (cartTotal < coupon.minTotal)
      throw new BadRequestException(
        `Order total must be at least $${coupon.minTotal.toFixed(2)} to use this coupon`,
      );
  }

  calculateDiscount(
    coupon: Coupon,
    items: CouponItem[],
    cartTotal: number,
  ): number {
    let applicableItems = items;

    // Filter by applicable products or categories
    const hasProductScope =
      coupon.applicableProductIds && coupon.applicableProductIds.length > 0;
    const hasCategoryScope =
      coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0;

    if (hasProductScope || hasCategoryScope) {
      applicableItems = items.filter(
        (i) =>
          (hasProductScope &&
            coupon.applicableProductIds.includes(i.productId)) ||
          (hasCategoryScope &&
            coupon.applicableCategoryIds.includes(i.categoryId)),
      );
    }

    const applicableTotal = applicableItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    if (
      applicableItems.length === 0 &&
      items.length > 0 &&
      (hasProductScope || hasCategoryScope)
    ) {
      throw new BadRequestException(
        `Coupon "${coupon.code}" is not applicable to any items in your cart`,
      );
    }

    let discount = 0;

    switch (coupon.type) {
      case 'FIXED_AMOUNT':
        discount = Math.min(coupon.discount, applicableTotal || cartTotal);
        break;
      case 'PERCENTAGE':
        discount = ((applicableTotal || cartTotal) * coupon.discount) / 100;
        break;
      case 'FREE_SHIPPING':
        // FREE_SHIPPING handles its logic in the order service for the shipping fee,
        // discount on items is 0.
        discount = 0;
        break;
      case 'BOGO':
        if (!coupon.buyQuantity || !coupon.getQuantity) {
          discount = 0;
        } else {
          // Flatten items into single units sorted by price descending
          const unitPrices: number[] = [];
          for (const item of applicableItems) {
            for (let i = 0; i < item.quantity; i++) {
              unitPrices.push(item.price);
            }
          }
          unitPrices.sort((a, b) => b - a);

          const totalBogoGroupSize = coupon.buyQuantity + coupon.getQuantity;
          let i = 0;

          // Process groups
          while (i + totalBogoGroupSize <= unitPrices.length) {
            // we have a valid group of (buy + get)
            // since array is sorted desc, the first `buyQuantity` elements are most expensive (paid)
            // the next `getQuantity` elements are cheaper (free / discounted)
            const freeStartIdx = i + coupon.buyQuantity;
            for (let j = 0; j < coupon.getQuantity; j++) {
              // Usually BOGO gives the cheapest items in the group free, or based on discount %.
              // We'll apply the `coupon.discount` percentage to the "get" items. 100% discount = Free.
              discount +=
                unitPrices[freeStartIdx + j] * (coupon.discount / 100);
            }
            i += totalBogoGroupSize;
          }
        }
        break;
      default:
        discount = 0;
    }

    discount = Math.min(discount, cartTotal); // Never discount more than total
    return Math.round(discount * 100) / 100;
  }
}
