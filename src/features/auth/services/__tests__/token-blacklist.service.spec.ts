import { describe, beforeEach, it, expect } from 'vitest';
import { TokenBlacklistService } from '../token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    service = new TokenBlacklistService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('should add token to blacklist', () => {
      const token = 'test-token-123';
      
      service.add(token);
      
      expect(service.contains(token)).toBe(true);
    });

    it('should add multiple tokens to blacklist', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      
      service.add(token1);
      service.add(token2);
      
      expect(service.contains(token1)).toBe(true);
      expect(service.contains(token2)).toBe(true);
    });
  });

  describe('contains', () => {
    it('should return false for non-blacklisted token', () => {
      expect(service.contains('non-existent-token')).toBe(false);
    });

    it('should return true for blacklisted token', () => {
      const token = 'blacklisted-token';
      service.add(token);
      
      expect(service.contains(token)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const token = 'Token-123';
      service.add(token);
      
      expect(service.contains('token-123')).toBe(false); // Different case
      expect(service.contains('Token-123')).toBe(true);  // Same case
    });
  });

  describe('edge cases', () => {
    it('should handle empty string token', () => {
      service.add('');
      expect(service.contains('')).toBe(true);
    });

    it('should handle very long token', () => {
      const longToken = 'a'.repeat(1000);
      service.add(longToken);
      
      expect(service.contains(longToken)).toBe(true);
    });

    it('should not contain token that was not added', () => {
      service.add('token-1');
      
      expect(service.contains('token-2')).toBe(false);
      expect(service.contains('token-1')).toBe(true);
    });
  });
});
