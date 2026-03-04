import { Test, TestingModule } from '@nestjs/testing';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('GiftCardsController', () => {
  let controller: GiftCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiftCardsController],
      providers: [
        {
          provide: GiftCardsService,
          useValue: {
            purchase: jest.fn(),
            getBalance: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GiftCardsController>(GiftCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
