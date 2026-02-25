import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';

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
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
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
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
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
