import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// 1. Mocks globales
/*vi.mock('bcrypt', () => ({
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue('hashed-pass')
}));*/

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
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        // Añade otros servicios que uses (MailService, TokenBlacklistService, etc.)
      ]
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    
    if (!authService['usersService']) {
      authService['usersService'] = mockUsersService;
    }
    if (!authService['jwtService']) {
      authService['jwtService'] = mockJwtService;
    }
  });

  describe('signIn', () => {
    it('should return token with valid credentials', async () => {
      // 5. Mock de usuario completo
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
        hashPassword: vi.fn()
      };

      // 6. Configurar todos los mocks
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      // 7. Ejecutar
      const result = await authService.signIn({
        email: 'test@test.com',
        password: 'valid-pass'
      });

      // 8. Verificaciones
      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-pass', 'hashed-pass');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: '1'
      });
    });
  });
});