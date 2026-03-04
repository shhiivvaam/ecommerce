import { Test, TestingModule } from '@nestjs/testing';
import { AffiliatesService } from './affiliates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AffiliatesService', () => {
  let service: AffiliatesService;

  const prismaMock = {
    affiliate: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliatesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AffiliatesService>(AffiliatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new affiliate', async () => {
    prismaMock.affiliate.findUnique.mockResolvedValue(null);
    prismaMock.affiliate.create.mockResolvedValue({
      id: 'aff-1',
      code: 'TESTCODE',
      commissionRate: 0.05,
      totalEarned: 0,
      userId: 'user-1',
    });

    const result = await service.register('user-1', { code: 'testcode' });
    expect(result.code).toBe('TESTCODE');
    expect(prismaMock.affiliate.create).toHaveBeenCalled();
  });

  it('should get the affiliate dashboard', async () => {
    prismaMock.affiliate.findUnique.mockResolvedValue({
      id: 'aff-1',
      code: 'TESTCODE',
      commissionRate: 0.05,
      totalEarned: 50,
      userId: 'user-1',
      orders: [],
    });

    const result = await service.getDashboard('user-1');
    expect(result.totalEarned).toBe(50);
  });
});
