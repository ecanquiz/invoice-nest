import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implementación real con Nodemailer, SendGrid, etc.
    console.log(`Verification email sent to ${email} with token ${token}`);
    const verificationUrl = `${this.configService.get(
      'APP_URL',
    )}/auth/verify-email?token=${token}`;
    console.log(`Verification URL: ${verificationUrl}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Implementación real con Nodemailer, SendGrid, etc.
    console.log(`Password reset email sent to ${email} with token ${token}`);
    const resetUrl = `${this.configService.get(
      'APP_URL',
    )}/reset-password?token=${token}`;
    console.log(`Reset URL: ${resetUrl}`);
  }
}
