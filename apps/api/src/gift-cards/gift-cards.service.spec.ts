import { Test, TestingModule } from '@nestjs/testing';
import { GiftCardsService } from './gift-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GiftCardsService', () => {
  let service: GiftCardsService;

  const prismaMock = {
    giftCard: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GiftCardsService>(GiftCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should purchase a gift card', async () => {
    prismaMock.giftCard.create.mockResolvedValue({
      id: 'gc-1',
      code: 'ABCDEF',
      initialBalance: 50,
      currentBalance: 50,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const result = await service.purchase({ amount: 50 });
    expect(result.currentBalance).toBe(50);
    expect(prismaMock.giftCard.create).toHaveBeenCalled();
  });

  it('should return balance for a valid gift card', async () => {
    prismaMock.giftCard.findUnique.mockResolvedValue({
      currentBalance: 25,
      initialBalance: 50,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const result = await service.getBalance('ABCDEF');
    expect(result.currentBalance).toBe(25);
  });

  it('should throw NotFoundException for missing gift card', async () => {
    prismaMock.giftCard.findUnique.mockResolvedValue(null);
    await expect(service.getBalance('INVALID')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException for expired gift card', async () => {
    prismaMock.giftCard.findUnique.mockResolvedValue({
      currentBalance: 25,
      initialBalance: 50,
      expiresAt: new Date('2000-01-01'),
    });
    await expect(service.getBalance('EXPIRED')).rejects.toThrow(
      BadRequestException,
    );
  });
});
