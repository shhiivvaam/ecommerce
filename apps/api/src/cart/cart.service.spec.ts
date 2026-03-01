import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

describe('CartService', () => {
  let service: CartService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      cart: {
        findUnique: jest.fn() as any,
        create: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
      },
      cartItem: {
        findUnique: jest.fn() as any,
        create: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        deleteMany: jest.fn() as any,
        findMany: jest.fn() as any,
      },
      product: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
      },
      variant: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
      },
      $transaction: jest.fn() as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return existing cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result).toEqual(mockCart);
      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    });

    it('should create new cart if none exists', async () => {
      const mockNewCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
      };

      prismaService.cart.findUnique.mockResolvedValue(null);
      prismaService.cart.create.mockResolvedValue(mockNewCart);

      const result = await service.getCart('user-1');

      expect(result).toEqual(mockNewCart);
      expect(prismaService.cart.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
        include: { items: { include: { product: true, variant: true } } },
      });
    });
  });

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      const userId = 'user-1';
      const addItemDto: AddCartItemDto = {
        productId: 'product-1',
        quantity: 2,
        variantId: 'variant-1',
      };

      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        stock: 10,
        price: 99.99,
      };
      const mockVariant = { id: 'variant-1', stock: 5 };
      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.variant.findUnique.mockResolvedValue(mockVariant);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });
      prismaService.cartItem.findUnique.mockResolvedValue(null);
      prismaService.cartItem.create.mockResolvedValue(mockCartItem);

      const result = await service.addItem(userId, addItemDto);

      expect(result).toEqual(mockCartItem);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const addItemDto: AddCartItemDto = {
        productId: 'invalid-product',
        quantity: 2,
      };

      prismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [],
      });
      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.addItem('user-1', addItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const addItemDto: AddCartItemDto = {
        productId: 'product-1',
        quantity: 10,
      };

      const mockCart = { id: 'cart-1', items: [] };
      const mockProduct = { id: 'product-1', stock: 5 };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.addItem('user-1', addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update existing item quantity', async () => {
      const userId = 'user-1';
      const addItemDto: AddCartItemDto = {
        productId: 'product-1',
        quantity: 3,
      };

      const mockCart = { id: 'cart-1', items: [] };
      const mockProduct = { id: 'product-1', stock: 10 };
      const mockExistingItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      };
      const mockUpdatedItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 5,
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });
      prismaService.cartItem.findUnique.mockResolvedValue(mockExistingItem);
      prismaService.cartItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await service.addItem(userId, addItemDto);

      expect(result).toEqual(mockUpdatedItem);
      expect(prismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });
  });

  describe('updateItem', () => {
    it('should update item quantity successfully', async () => {
      const userId = 'user-1';
      const itemId = 'item-1';
      const updateItemDto: UpdateCartItemDto = { quantity: 5 };

      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      };
      const mockProduct = { id: 'product-1', stock: 10 };
      const mockUpdatedItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 5,
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });
      prismaService.cartItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateItem(userId, itemId, updateItemDto);

      expect(result).toEqual(mockUpdatedItem);
      expect(prismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });

    it('should throw NotFoundException if cart item does not exist', async () => {
      prismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [],
      });
      prismaService.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem('user-1', 'invalid-item', { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove item if quantity is 0', async () => {
      const userId = 'user-1';
      const itemId = 'item-1';
      const updateItemDto: UpdateCartItemDto = { quantity: 0 };

      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });
      prismaService.cartItem.delete.mockResolvedValue(mockCartItem);

      const result = await service.updateItem(userId, itemId, updateItemDto);

      expect(result).toEqual(mockCartItem);
      expect(prismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart successfully', async () => {
      const userId = 'user-1';
      const itemId = 'item-1';

      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prismaService.cartItem.delete.mockResolvedValue(mockCartItem);

      await service.removeItem(userId, itemId);

      expect(prismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it('should throw NotFoundException if item does not exist', async () => {
      prismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [],
      });
      prismaService.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItem('user-1', 'invalid-item'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const userId = 'user-1';

      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      await service.clearCart(userId);

      expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });

  describe('getCartSummary', () => {
    it('should return cart summary with totals', async () => {
      const userId = 'user-1';

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            product: { price: 99.99 },
            variant: { priceAdjustment: 0 },
          },
          {
            id: 'item-2',
            quantity: 1,
            product: { price: 149.99 },
            variant: { priceAdjustment: 10 },
          },
        ],
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getCartSummary(userId);

      expect(result).toEqual({
        totalItems: 3,
        subtotal: 359.97, // (99.99 * 2) + (149.99 + 10)
        tax: 0,
        shipping: 0,
        total: 359.97,
      });
    });

    it('should return empty summary for empty cart', async () => {
      const userId = 'user-1';

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getCartSummary(userId);

      expect(result).toEqual({
        totalItems: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
      });
    });
  });
});
