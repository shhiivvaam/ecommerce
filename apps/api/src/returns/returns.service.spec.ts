import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsService } from './returns.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, ReturnRequestStatus } from '@prisma/client';

describe('ReturnsService', () => {
  let service: ReturnsService;

  const prismaMock = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    returnRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a return request for a delivered order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.DELIVERED,
      totalAmount: 100,
      returnRequests: [],
    });
    prismaMock.returnRequest.create.mockResolvedValue({
      id: 'rr-1',
      orderId: 'order-1',
      status: ReturnRequestStatus.PENDING,
    });

    const result = await service.createReturnRequest('user-1', 'order-1', {
      reason: 'Wrong size',
    });
    expect(result.status).toBe(ReturnRequestStatus.PENDING);
  });

  it('should throw NotFoundException if order not found', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);
    await expect(
      service.createReturnRequest('user-1', 'bad-id', { reason: 'reason' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if order not delivered', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PROCESSING,
      totalAmount: 100,
      returnRequests: [],
    });
    await expect(
      service.createReturnRequest('user-1', 'order-1', { reason: 'reason' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return all return requests for admin', async () => {
    prismaMock.returnRequest.findMany.mockResolvedValue([{ id: 'rr-1' }]);
    const result = await service.findAllForAdmin();
    expect(result.length).toBe(1);
  });

  it('should update return request status', async () => {
    prismaMock.returnRequest.findUnique.mockResolvedValue({
      id: 'rr-1',
      orderId: 'order-1',
      order: { id: 'order-1' },
    });
    prismaMock.returnRequest.update.mockResolvedValue({
      id: 'rr-1',
      status: ReturnRequestStatus.APPROVED,
    });

    const result = await service.updateStatus('rr-1', { status: 'APPROVED' });
    expect(result.status).toBe(ReturnRequestStatus.APPROVED);
  });
});
