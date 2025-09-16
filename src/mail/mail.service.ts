import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../common';

@Injectable()
export class MailService {
  // private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService
  ) {
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
        <p>Hola,</p>
        <p>Para completar tu registro en nuestra plataforma, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">Verificar Email</a>
        </div>
          <p>Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
  
          <p style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; font-size: 12px; color: #666; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          Este enlace expirará en 24 horas. Si no solicitaste este registro, por favor ignora este email.
          </p>
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
