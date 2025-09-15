import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: this.configService.get('MAIL_PORT', 1025),
      secure: false,
      ignoreTLS: true, // For MailHog
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
    const mailOptions = {
      from: this.configService.get('MAIL_FROM', 'no-reply@tuapp.com'),
      to: email,
      subject: 'Verifica tu email',
      html: `
        <h2>Verifica tu dirección de email</h2>
        <p>Haz clic en el siguiente enlace para verificar tu email:</p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">Verificar Email</a>
        <p>O copia esta URL en tu navegador:</p>
        <p>${verificationUrl}</p>
        <p>Este enlace expirará en 24 horas.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email} with token ${token}`);
      this.logger.log(`Verification URL: ${verificationUrl}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error);
      // We do not throw an error so as not to break the registration flow.
    }    
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const mailOptions = {
      from: this.configService.get('MAIL_FROM', 'no-reply@tuapp.com'),
      to: email,
      subject: 'Restablecer contraseña',
      html: `
        <h2>Restablecer contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #dc3545;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">Restablecer Contraseña</a>
        <p>O copia esta URL en tu navegador:</p>
        <p>${resetUrl}</p>
        <p>Este enlace expirará en 1 hora.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email} with token ${token}`);
      this.logger.log(`Reset URL: ${resetUrl}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error);
    }
  }
}
