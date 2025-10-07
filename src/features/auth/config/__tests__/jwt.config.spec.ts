import { describe, it, expect, beforeEach } from 'vitest';
import jwtConfig from '../jwt.config';

describe('JwtConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env vars are set', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;

    const config = jwtConfig();
    
    expect(config).toEqual({
      secret: undefined,
      expiresIn: '3600s'
    });
  });

  it('should use environment variables when available', () => {
    process.env.JWT_SECRET = 'super-secret-key';
    process.env.JWT_EXPIRES_IN = '7200s';

    const config = jwtConfig();
    
    expect(config).toEqual({
      secret: 'super-secret-key',
      expiresIn: '7200s'
    });
  });

  it('should be registered with correct namespace', () => {
    expect(jwtConfig.KEY).toBe('CONFIGURATION(jwt)');    
    expect(jwtConfig.KEY).toContain('jwt');
    expect(jwtConfig.KEY).toMatch(/jwt/);
  });

  it('should have correct configuration structure', () => {
    process.env.JWT_SECRET = 'test-secret';
    
    const config = jwtConfig();
    const configFunction = jwtConfig;
    
    expect(typeof configFunction).toBe('function');
    expect(config).toHaveProperty('secret');
    expect(config).toHaveProperty('expiresIn');
    expect(config.secret).toBe('test-secret');
    expect(config.expiresIn).toBe('3600s');
  });
});
