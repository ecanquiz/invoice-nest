import { validate } from 'class-validator';
import { SignUpDto } from '../sign-up.dto';
import { SignInDto } from '../sign-in.dto';
import { ForgotPasswordDto } from '../forgot-password.dto';
import { ResetPasswordDto } from '../reset-password.dto';

describe('Auth DTOs Validation', () => {
  describe('SignUpDto', () => {
    it('should validate correct signup data', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = 'StrongPass123!';
      dto.name = 'John Doe';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid email', async () => {
      const dto = new SignUpDto();
      dto.email = 'invalid-email';
      dto.password = 'StrongPass123!';
      dto.name = 'John Doe';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('email');
    });

    it('should reject weak password', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = 'weak';
      dto.name = 'John Doe';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('password');
    });

    it('should reject short name', async () => {
      const dto = new SignUpDto();
      dto.email = 'test@example.com';
      dto.password = 'StrongPass123!';
      dto.name = 'J'; // Too short

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('SignInDto', () => {
    it('should validate correct signin data', async () => {
      const dto = new SignInDto();
      dto.email = 'test@example.com';
      dto.password = 'any-password';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject empty email', async () => {
      const dto = new SignInDto();
      dto.email = '';
      dto.password = 'any-password';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('email');
    });

    it('should reject empty password', async () => {
      const dto = new SignInDto();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('password');
    });

    it('should reject empty email and password', async () => {
      const dto = new SignInDto();
      dto.email = '';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
      expect(errors.map(e => e.property)).toEqual(['email', 'password']);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('should validate correct email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('ResetPasswordDto', () => {
    it('should validate correct reset data', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-token';
      dto.newPassword = 'StrongNewPass123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject weak new password', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-token';
      dto.newPassword = 'weak';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('newPassword');
    });

    it('should reject empty token', async () => {
      const dto = new ResetPasswordDto();
      dto.token = '';
      dto.newPassword = 'StrongNewPass123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('token');
    });
  });
});
