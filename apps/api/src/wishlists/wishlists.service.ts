import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) { }

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  }

  async addToWishlist(userId: string, productIdOrSlug: string) {
    let product = await this.prisma.product.findUnique({
      where: { id: productIdOrSlug },
    });

    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { slug: productIdOrSlug },
      });
    }

    if (!product) throw new NotFoundException('Product not found');

    const productId = product.id;

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('Product already in wishlist');

    return this.prisma.wishlist.create({
      data: { userId, productId },
      include: { product: { include: { category: true } } },
    });
  }

  async removeFromWishlist(userId: string, productIdOrSlug: string) {
    let productId = productIdOrSlug;

    // If it's a slug, we need the actual ID to delete from the unique compound index
    if (!productIdOrSlug.match(/^[a-z0-9]{24,25}$/i)) { // Simple CUID-ish check or just always fetch
      const product = await this.prisma.product.findUnique({
        where: { slug: productIdOrSlug },
        select: { id: true },
      });
      if (product) productId = product.id;
    }

    const item = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new NotFoundException('Item not found in wishlist');

    return this.prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async isInWishlist(userId: string, productIdOrSlug: string): Promise<boolean> {
    let productId = productIdOrSlug;

    if (!productIdOrSlug.match(/^[a-z0-9]{24,25}$/i)) {
      const product = await this.prisma.product.findUnique({
        where: { slug: productIdOrSlug },
        select: { id: true },
      });
      if (product) productId = product.id;
    }

    const item = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!item;
  }
}
