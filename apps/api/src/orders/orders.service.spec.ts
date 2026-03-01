import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';
import { EmailService } from '../email/email.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaMock: {
    order: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    settings: {
      findFirst: jest.Mock;
    };
    coupon: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    address: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    variant: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let emailServiceMock: jest.Mocked<EmailService>;

  beforeEach(async () => {
    emailServiceMock = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    } as any;

    prismaMock = {
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-123',
          status: OrderStatus.PENDING,
          totalAmount: 100,
        }),
        findMany: jest.fn().mockResolvedValue([{ id: 'order-123' }]),
        findFirst: jest.fn().mockResolvedValue({ id: 'order-123' }),
        update: jest.fn().mockResolvedValue({
          id: 'order-123',
          status: OrderStatus.PROCESSING,
        }),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'prod-1', price: 100, stock: 10 }]),
        update: jest.fn().mockResolvedValue({ id: 'prod-1', stock: 9 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
      },
      settings: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ taxPercent: 5, shippingFlat: 10 }),
      },
      coupon: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
      },
      address: {
        findUnique: jest.fn().mockResolvedValue({
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'US',
          zipCode: '12345',
        }),
        create: jest.fn().mockResolvedValue({ id: 'addr-123' }),
      },
      variant: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },

      $transaction: jest
        .fn()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        .mockImplementation(async (cb: any) => await cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order successfully', async () => {
    const orderDto = {
      totalAmount: 100,
      items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
      addressId: 'address-1',
    };
    const order = await service.create(
      'user-1',
      orderDto as unknown as CreateOrderDto,
    );
    expect(order.id).toEqual('order-123');
    expect(prismaMock.order.create).toHaveBeenCalled();
  });

  it('should fetch orders by user id', async () => {
    const orders = await service.findAllByUser('user-1');
    expect(orders.length).toBeGreaterThan(0);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('should update order status', async () => {
    const updated = await service.updateStatus(
      'order-123',
      OrderStatus.PROCESSING,
    );
    expect(updated.status).toEqual(OrderStatus.PROCESSING);
    expect(prismaMock.order.update).toHaveBeenCalled();
  });
});
