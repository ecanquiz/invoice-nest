import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { BadRequestException, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { TokenBlacklistService } from '../token-blacklist.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../mail/mail.service';

// Global Mocks
vi.mock('bcrypt', async () => {
  const actual = await vi.importActual<typeof bcrypt>('bcrypt');
  return {
    ...actual,
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hashed-pass')
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUsersService = {
    findByEmail: vi.fn()
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock-token'),
    verify: vi.fn(),
    decode: vi.fn()
  };

  const mockUserRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn()
  };

  const mockRoleRepository = {
    findOne: vi.fn()
  };

  const mockUserRole = {
    id: 'role-user-id',
    name: 'user',
    isActive: true,
  };

  const mockMailService = {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn()
  };

  const mockTokenBlacklist = {
    add: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository
        },
        {
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: MailService,
          useValue: mockMailService
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklist
        }
      ]
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    
    if (!authService['usersService']) {
      authService['usersService'] = mockUsersService as unknown as UsersService;
    }
    if (!authService['jwtService']) {
      authService['jwtService'] = mockJwtService as unknown as JwtService;
    }
  });

  describe('signIn', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should return token with valid credentials', async () => {
      // Full user mockup
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-pass',
        name: 'Test User',
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        roles: [],
        //hashPassword: vi.fn()
      };

      // Configure all mocks
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      // Execute
      const result = await authService.signIn({
        email: 'test@test.com',
        password: 'valid-pass'
      });

      // Verifications
      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-pass', 'hashed-pass');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: '1'
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.signIn({
        email: 'nonexistent@test.com',
        password: 'any-password'
      })).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('nonexistent@test.com');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-pass',
        isEmailVerified: true
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any); // Incorrect password

      await expect(authService.signIn({
        email: 'test@test.com',
        password: 'wrong-password'
      })).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-pass');
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-pass',
        isEmailVerified: false // Email not verified
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      await expect(authService.signIn({
        email: 'test@test.com',
        password: 'valid-password'
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty or whitespace passwords', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-pass',
        isEmailVerified: true
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      // Test with spaces
      const result = await authService.signIn({
        email: 'test@test.com',
        password: '  valid-password  ' // With spaces
      });

      expect(result.accessToken).toBe('mock-token');
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-password', 'hashed-pass'); // Trim applied
    });
  });

  describe('signUp', () => {
    it('should create a new user and return token', async () => {
      const signUpDto = {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      };

      const mockUser = {
        id: '1',
        ...signUpDto,
        isEmailVerified: false,
        emailVerificationToken: 'verification-token',
      } as User;

      // Mock repository responses
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Mock JWT and mail service
      mockJwtService.sign.mockReturnValue('mock-token');
      vi.spyOn(authService as any, 'sendVerificationEmail').mockResolvedValue(undefined);

      const result = await authService.signUp(signUpDto);

      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com', deletedAt: IsNull() } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        emailVerificationToken: null,
        password: 'hashed-pass',
        name: 'Test User',
        isEmailVerified: false,
        passwordResetExpires: null,
        passwordResetToken: null,
        roles: [],
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error if email already exists', async () => {
      const signUpDto = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'Test User'
      };

      const existingUser = { id: '1', email: 'existing@test.com' } as User;
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'existing@test.com', deletedAt: IsNull() } });
    });
  });

  describe('logout', () => {
    it('should logout successfully and return remaining time', async () => {
      const mockToken = 'valid-token';
      const authorizationHeader = `Bearer ${mockToken}`;
      const userId = '1';
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      mockJwtService.decode.mockReturnValue({ exp: futureTimestamp });    
      
      const mockTokenBlacklist = { add: vi.fn() };

      if (!authService['tokenBlacklist']) { 
        (authService as any)['tokenBlacklist'] = mockTokenBlacklist as unknown as typeof mockTokenBlacklist;
      }

      const result = await authService.logout(authorizationHeader, userId);

      expect(result.message).toBe('Logout successful');
      expect(result.tokenExpiresIn).toContain('seconds remaining');
      expect(mockTokenBlacklist.add).toHaveBeenCalledWith(mockToken);
      expect(mockJwtService.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.logout('', '1')).rejects.toThrow(UnauthorizedException);
    });    
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      const mockUser = { id: '1', email: 'test@test.com' } as User;
      const forgotPasswordDto = { email: 'test@test.com' };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('reset-token');
    
      // Mock mail service
      const mockMailService = { sendPasswordResetEmail: vi.fn() };
      if (!authService['mailService']) {
        authService['mailService'] = mockMailService as any;
      }

      await authService.forgotPassword(forgotPasswordDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: '1' },
        { expiresIn: '1h' }
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith('test@test.com', 'reset-token');
    });

    it('should not throw error for non-existing user', async () => {
      const forgotPasswordDto = { email: 'nonexistent@test.com' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.forgotPassword(forgotPasswordDto)).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto = { token: 'valid-token', newPassword: 'new-password' };
      const mockUser = {
        id: '1',
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 3600000)
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-new-password' as any);

      await authService.resetPassword(resetPasswordDto);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', passwordResetToken: 'valid-token' }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        password: 'hashed-new-password',
        passwordResetToken: null,
        passwordResetExpires: null
      });
    });

    it('should hash the new password before saving', async () => {
      const resetPasswordDto = { token: 'valid-token', newPassword: 'plain-password' };
      const mockUser = {
        id: '1',
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 3600000)
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as any);

      await authService.resetPassword(resetPasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
  
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-password'
        })
      );
    });

    it('should throw error for invalid token', async () => {
      const resetPasswordDto = { token: 'invalid-token', newPassword: 'new-password' };
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        id: '1',
        emailVerificationToken: 'valid-token',
        isEmailVerified: false
      } as User;

      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail('valid-token');

      expect(result.message).toBe('Email successfully verified');
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', emailVerificationToken: 'valid-token' }
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        isEmailVerified: true,
        emailVerificationToken: null
      });
    });

    it('should throw error for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Private methods', () => {
    it('should generate token correctly', async () => {
      const mockUser = { id: '1', email: 'test@test.com' } as User;
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = await (authService as any).generateToken(mockUser);

      expect(result).toEqual({ accessToken: 'generated-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: '1'
      });
    });

    it('should send verification email', async () => {
      const mockUser = { id: '1', email: 'test@test.com' } as User;
      mockJwtService.sign.mockReturnValue('verification-token');
    
      const mockMailService = { sendVerificationEmail: vi.fn() };
      if (!authService['mailService']) {
        authService['mailService'] = mockMailService as any;
      }

      await (authService as any).sendVerificationEmail(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: '1' },
        { expiresIn: '1d' }
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith('test@test.com', 'verification-token');
    });
  });
});
