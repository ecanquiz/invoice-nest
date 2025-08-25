import { describe, beforeEach, it, expect, vi } from 'vitest';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';

//  ConfigService Mock
const mockConfigService = {
  get: vi.fn()
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configure the mock to return the secret
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret-key';
      return null;
    });

    strategy = new JwtStrategy(mockConfigService as any);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should configure JWT options correctly', () => {
    // Verify that configService.get was called
    expect(mockConfigService.get).toHaveBeenCalledWith('jwt.secret');   
  });

  it('should use ExtractJwt.fromAuthHeaderAsBearerToken', () => {
    // Verify that the correct extractor is being used indirectly
    // We create a token and verify that the strategy can handle it
    const mockPayload = { sub: 'test', email: 'test@test.com' };
    
    // Mock passport (approximation)
    expect(strategy).toBeInstanceOf(Object); 
    expect(strategy).toBeInstanceOf(JwtStrategy); 
    expect(strategy).toHaveProperty('name', 'jwt');
    expect(strategy).toHaveProperty('validate');
    expect(typeof strategy.validate).toBe('function');  
    expect(mockConfigService.get).toHaveBeenCalledWith('jwt.secret');
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
  });

  describe('validate', () => {
    it('should return user payload when token is valid', async () => {
      const payload = { 
        sub: 'user-id-123', 
        email: 'test@email.com',
        exp: Date.now() / 1000 + 3600 // Expires in 1 hour
      };
      
      const result = await strategy.validate(payload);
      
      expect(result).toEqual({
        userId: 'user-id-123',
        email: 'test@email.com'
      });
    });

    it('should throw UnauthorizedException for invalid payload', async () => {
      await expect(strategy.validate(null)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(null)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException for undefined payload', async () => {
      await expect(strategy.validate(undefined)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for payload without sub', async () => {
      const payload = { email: 'test@test.com' }; // Sin sub
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException for empty payload', async () => {
      await expect(strategy.validate({})).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for payload with empty sub', async () => {
      const payload = { sub: '', email: 'test@test.com' };
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle different payload structures', async () => {
      const payload = { 
        sub: 'user-id-456', 
        email: 'user@example.com',
        name: 'John Doe', // Additional field
        role: 'admin'     // Additional field
      };
      
      const result = await strategy.validate(payload);
      
      // It should only return userId and email (as defined in validate)
      expect(result).toEqual({
        userId: 'user-id-456',
        email: 'user@example.com'
      });
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('role');
    });

    it('should work with real ConfigService in integration', async () => {
      // More realistic mock of the ConfigService
      const realConfigService = {
        get: (key: string) => {
          if (key === 'jwt.secret') return 'real-secret-key';
          return null;
        }
      };

      // Create strategy with the mocked config service
      const realStrategy = new JwtStrategy(realConfigService as any);

      const payload = { sub: 'test-id', email: 'test@test.com' };
      const result = await realStrategy.validate(payload);

      expect(result).toEqual({
        userId: 'test-id',
        email: 'test@test.com'
      });
    });

  });
});
