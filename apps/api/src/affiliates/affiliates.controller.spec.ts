import { Test, TestingModule } from '@nestjs/testing';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('AffiliatesController', () => {
  let controller: AffiliatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliatesController],
      providers: [
        {
          provide: AffiliatesService,
          useValue: {
            register: jest.fn(),
            getDashboard: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AffiliatesController>(AffiliatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
