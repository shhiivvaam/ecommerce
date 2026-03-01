import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

describe('CartService', () => {
  let service: CartService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      cart: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      cartItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      variant: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(),
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
    });
  });

  describe('addItem', () => {
    const userId = 'user-1';
    const addItemDto: AddCartItemDto = {
      productId: 'product-1',
      quantity: 2,
    };

    const mockCart = { id: 'cart-1', userId: 'user-1' };
    const mockProduct = {
      id: 'product-1',
      title: 'Test Product',
      stock: 10,
      price: 99.99,
      variants: [],
    };

    beforeEach(() => {
      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.cartItem.findFirst.mockResolvedValue(null);
      prismaService.cart.update.mockResolvedValue(mockCart);
    });

    it('should add item to cart successfully', async () => {
      await service.addItem(userId, addItemDto);

      expect(prismaService.cartItem.create).toHaveBeenCalled();
      expect(prismaService.cart.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const highQtyDto = { ...addItemDto, quantity: 20 };

      await expect(service.addItem(userId, highQtyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update existing item quantity', async () => {
      const mockExistingItem = {
        id: 'item-1',
        quantity: 2,
      };
      prismaService.cartItem.findFirst.mockResolvedValue(mockExistingItem);

      await service.addItem(userId, addItemDto);

      expect(prismaService.cartItem.update).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    const userId = 'user-1';
    const itemId = 'item-1';
    const updateItemDto: UpdateCartItemDto = { quantity: 5 };

    const mockCart = { id: 'cart-1' };
    const mockItem = {
      id: itemId,
      product: { stock: 10 },
      variant: null,
    };

    beforeEach(() => {
      prismaService.cart.findUnique.mockResolvedValue(mockCart);
      prismaService.cartItem.findFirst.mockResolvedValue(mockItem);
      prismaService.cart.update.mockResolvedValue(mockCart);
    });

    it('should update item quantity successfully', async () => {
      await service.updateItem(userId, itemId, updateItemDto);
      expect(prismaService.cartItem.update).toHaveBeenCalled();
    });

    it('should remove item if quantity is 0', async () => {
      await service.updateItem(userId, itemId, { quantity: 0 });
      expect(prismaService.cartItem.delete).toHaveBeenCalled();
    });
  });

  describe('getCartSummary', () => {
    it('should return cart summary with totals', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            product: { price: 100 },
            variant: null,
          },
          {
            id: 'item-2',
            quantity: 1,
            product: { price: 150 },
            variant: { priceDiff: 10 },
          },
        ],
      };

      prismaService.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getCartSummary('user-1');

      expect(result).toEqual({
        totalItems: 3,
        subtotal: 360, // (100*2) + (150+10)*1
        tax: 0,
        shipping: 0,
        total: 360,
      });
    });

    it('should return empty summary for empty cart', async () => {
      prismaService.cart.findUnique.mockResolvedValue(null);

      const result = await service.getCartSummary('user-1');

      expect(result.totalItems).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
