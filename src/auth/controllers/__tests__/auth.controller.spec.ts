import { describe, beforeEach, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { LoggerService } from '../../../common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto';
import { ResetPasswordDto } from '../../dto/reset-password.dto';

const mockLoggerService = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// AuthService Mock
const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn()
};

// AuthGuard Mock
const mockAuthGuard = {
  canActivate: vi.fn().mockReturnValue(true)
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService
        }
      ]
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue(mockAuthGuard)
    .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    loggerService = module.get<LoggerService>(LoggerService);

  
    // // We ensure that the mocks are injected
    if (!controller['authService']) {
      (controller['authService'] as any) = authService;
    }
    if (!controller['logger']) {
      (controller['logger'] as any) = loggerService;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User'
      };

      const expectedResult = { accessToken: 'mock-token' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'Password123!'
      };

      const expectedResult = { accessToken: 'mock-token' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with correct parameters', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@test.com'
      };

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toBeUndefined();
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with correct parameters', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'reset-token',
        newPassword: 'NewPassword123!'
      };

      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toBeUndefined();
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with correct token', async () => {
      const token = 'verification-token';
      const expectedResult = { message: 'Email verified successfully' };
      
      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(token);

      expect(result).toEqual(expectedResult);
      expect(authService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct parameters', async () => {
      const authHeader = 'Bearer mock-token';
      const expectedResult = { 
        message: 'Logout successful', 
        tokenExpiresIn: '3600 seconds remaining' 
      };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(authHeader);

      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith(authHeader);
    });

    it('should handle logout errors', async () => {
      const authHeader = 'Bearer mock-token';

      mockAuthService.logout.mockRejectedValue(new UnauthorizedException('Invalid token'));

      await expect(controller.logout(authHeader))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('testBcrypt', () => {
    it('should return bcrypt test results', async () => {
      // Mock bcrypt functions
      vi.mock('bcrypt', () => ({
        hash: vi.fn().mockResolvedValue('hashed-password'),
        compare: vi.fn().mockResolvedValue(true)
      }));

      const result = await controller.testBcrypt();

      expect(result).toEqual({
        original: 'Password123',
        hash: 'hashed-password',
        match: true,
        sameAsStored: true
      });
    });
  });
});
