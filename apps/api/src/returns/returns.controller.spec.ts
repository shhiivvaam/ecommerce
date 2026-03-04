import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ReturnsController', () => {
  let controller: ReturnsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReturnsController],
      providers: [
        {
          provide: ReturnsService,
          useValue: {
            createReturnRequest: jest.fn(),
            findAllForAdmin: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReturnsController>(ReturnsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
