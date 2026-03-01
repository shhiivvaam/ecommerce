import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: { name: 'CUSTOMER' },
      };
      const mockToken = 'jwt-token';

      jest
        .spyOn(controller['authService'], 'validateUser')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(controller['authService'], 'login').mockReturnValue({
        access_token: mockToken,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({
        access_token: mockToken,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });
      expect(controller['authService'].validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      jest
        .spyOn(controller['authService'], 'validateUser')
        .mockResolvedValue(null);

      await expect(
        controller.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const mockResponse = {
        access_token: 'jwt-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      };

      jest
        .spyOn(controller['authService'], 'register')
        .mockResolvedValue(mockResponse as any);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(controller['authService'].register).toHaveBeenCalledWith(
        registerDto,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email', async () => {
      const forgotDto = { email: 'test@example.com' };
      const mockResponse = {
        message: 'If an account exists, a password reset email has been sent.',
      };

      jest
        .spyOn(controller['authService'], 'forgotPassword')
        .mockResolvedValue(mockResponse as any);

      const result = await controller.forgotPassword(forgotDto);

      expect(result).toEqual(mockResponse);
      expect(controller['authService'].forgotPassword).toHaveBeenCalledWith(
        forgotDto,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const resetDto = { token: 'valid-token', newPassword: 'newPassword' };
      const mockResponse = { message: 'Password has been successfully reset' };

      jest
        .spyOn(controller['authService'], 'resetPassword')
        .mockResolvedValue(mockResponse as any);

      const result = await controller.resetPassword(resetDto);

      expect(result).toEqual(mockResponse);
      expect(controller['authService'].resetPassword).toHaveBeenCalledWith(
        resetDto,
      );
    });
  });
});
