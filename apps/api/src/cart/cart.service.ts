import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId)
      throw new BadRequestException('Session identifier required');

    let cart;
    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    } else {
      cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId: sessionId! },
        include: { items: { include: { product: true, variant: true } } },
      });
    }

    return cart;
  }

  private async calculateTotal(cartId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true, variant: true },
    });

    const total = items.reduce((sum, item) => {
      let price = item.product.discounted ?? item.product.price;
      if (item.variant) {
        price += item.variant.priceDiff;
      }
      return sum + price * item.quantity;
    }, 0);

    return this.prisma.cart.update({
      where: { id: cartId },
      data: { total },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    data: AddCartItemDto,
  ) {
    const cart = await this.getCart(userId, sessionId);
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { variants: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    let totalStock = product.stock;
    if (data.variantId) {
      const variant = product.variants.find((v) => v.id === data.variantId);
      if (!variant) throw new BadRequestException('Invalid variant selected');
      totalStock = variant.stock;
    }

    // Calculate reserved stock
    const reserved = await this.prisma.cartItem.aggregate({
      where: {
        productId: data.productId,
        variantId: data.variantId || undefined,
        expiresAt: { gt: new Date() },
        cartId: { not: cart.id },
      },
      _sum: { quantity: true },
    });
    const reservedStock = reserved._sum.quantity || 0;
    const availableStock = totalStock - reservedStock;

    // Check if item already exists in cart with same variance
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId || undefined,
      },
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins hold

    if (existingItem) {
      if (existingItem.quantity + data.quantity > availableStock) {
        throw new BadRequestException(
          `Only ${availableStock} items remaining (some may be held in other carts)`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          expiresAt, // renew hold
        },
      });
    } else {
      if (data.quantity > availableStock) {
        throw new BadRequestException(
          `Only ${availableStock} items remaining (some may be held in other carts)`,
        );
      }
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          variantId: data.variantId || undefined,
          quantity: data.quantity,
          expiresAt,
        },
      });
    }

    return this.calculateTotal(cart.id);
  }

  async updateItem(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    data: UpdateCartItemDto,
  ) {
    const cart = await this.getCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true, variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    const totalStock = item.variant ? item.variant.stock : item.product.stock;

    const reserved = await this.prisma.cartItem.aggregate({
      where: {
        productId: item.productId,
        variantId: item.variantId || undefined,
        expiresAt: { gt: new Date() },
        cartId: { not: cart.id },
      },
      _sum: { quantity: true },
    });
    const reservedStock = reserved._sum.quantity || 0;
    const availableStock = totalStock - reservedStock;

    if (data.quantity > availableStock) {
      throw new BadRequestException(
        `Only ${availableStock} items remaining (some may be held in other carts)`,
      );
    }

    if (data.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: data.quantity,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }

    return this.calculateTotal(cart.id);
  }

  async removeItem(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
  ) {
    const cart = await this.getCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.calculateTotal(cart.id);
  }

  async clearCart(userId: string | undefined, sessionId: string | undefined) {
    const cart = await this.getCart(userId, sessionId);

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.calculateTotal(cart.id);
  }

  async getCartSummary(
    userId: string | undefined,
    sessionId: string | undefined,
  ) {
    let cart;
    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    } else {
      cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    }

    if (!cart) {
      return {
        totalItems: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
      };
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => {
      let price = item.product.discounted ?? item.product.price;
      if (item.variant) {
        price += item.variant.priceDiff;
      }
      return sum + price * item.quantity;
    }, 0);

    // Rounding to handle floating point issues
    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    return {
      totalItems,
      subtotal: roundedSubtotal,
      tax: 0, // Placeholder for future implementation
      shipping: 0, // Placeholder
      total: roundedSubtotal,
    };
  }
}
