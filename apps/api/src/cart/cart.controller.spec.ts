import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;

  beforeEach(async () => {
    const mockCartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      getCartSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get(CartService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should return the current user cart', async () => {
      const mockUser = { id: 'user-1', sub: 'user-1' };
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            product: { id: 'product-1', title: 'Test Product', price: 99.99 },
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart({ user: mockUser });

      expect(result).toEqual(mockCart);
      expect(cartService.getCart).toHaveBeenCalledWith('user-1');
    });
  });

  describe('addItem', () => {
    it('should add an item to the cart', async () => {
      const mockUser = { id: 'user-1', sub: 'user-1' };
      const addItemDto: AddCartItemDto = {
        productId: 'product-1',
        quantity: 2,
        variantId: 'variant-1',
      };

      const mockCartItem = {
        id: 'item-1',
        productId: 'product-1',
        quantity: 2,
        variantId: 'variant-1',
      };

      cartService.addItem.mockResolvedValue(mockCartItem);

      const result = await controller.addItem({ user: mockUser }, addItemDto);

      expect(result).toEqual(mockCartItem);
      expect(cartService.addItem).toHaveBeenCalledWith('user-1', addItemDto);
    });
  });

  describe('updateItem', () => {
    it('should update a cart item quantity', async () => {
      const mockUser = { id: 'user-1', sub: 'user-1' };
      const updateItemDto: UpdateCartItemDto = { quantity: 5 };

      const mockUpdatedItem = {
        id: 'item-1',
        productId: 'product-1',
        quantity: 5,
      };

      cartService.updateItem.mockResolvedValue(mockUpdatedItem);

      const result = await controller.updateItem(
        { user: mockUser },
        'item-1',
        updateItemDto,
      );

      expect(result).toEqual(mockUpdatedItem);
      expect(cartService.updateItem).toHaveBeenCalledWith(
        'user-1',
        'item-1',
        updateItemDto,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', async () => {
      const mockUser = { id: 'user-1', sub: 'user-1' };

      cartService.removeItem.mockResolvedValue(undefined);

      await controller.removeItem({ user: mockUser }, 'item-1');

      expect(cartService.removeItem).toHaveBeenCalledWith('user-1', 'item-1');
    });
  });

  describe('clearCart', () => {
    it('should clear the user cart', async () => {
      const mockUser = { id: 'user-1', sub: 'user-1' };

      cartService.clearCart.mockResolvedValue(undefined);

      await controller.clearCart({ user: mockUser });

      expect(cartService.clearCart).toHaveBeenCalledWith('user-1');
    });
  });
});
