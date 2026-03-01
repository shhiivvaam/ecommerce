import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getProductReviews(productId: string, page = 1, limit = 20) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const [reviews, total, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count({ where: { productId } }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
    ]);

    const avgRatingRaw = aggregate._avg.rating ?? 0;
    const avgRating = Math.round(avgRatingRaw * 10) / 10;

    return {
      reviews,
      avgRating,
      total,
      page,
      limit: safeLimit,
    };
  }

  async createReview(userId: string, productId: string, data: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findFirst({
      where: { userId, productId },
    });
    if (existing)
      throw new ConflictException('You have already reviewed this product');

    return this.prisma.review.create({
      data: { userId, productId, rating: data.rating, comment: data.comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async updateReview(userId: string, reviewId: string, data: CreateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId)
      throw new ForbiddenException('You can only edit your own reviews');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating: data.rating, comment: data.comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId)
      throw new ForbiddenException('You can only delete your own reviews');

    return this.prisma.review.delete({ where: { id: reviewId } });
  }
}
