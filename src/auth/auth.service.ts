import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ accessToken: string }> {
    const { email, password, name } = signUpDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const user = this.usersRepository.create({
      email,
      password,
      name,
      isEmailVerified: false,
    });

    await this.usersRepository.save(user);

    // Enviar email de verificación
    await this.sendVerificationEmail(user);

    return this.generateToken(user);
  }

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string }> {
    const { email, password } = signInDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    return this.generateToken(user);
  }

  async logout(userId: string): Promise<void> {
    // En una implementación real, podrías invalidar el token aquí
    // Esto es solo un marcador de posición
    console.log(`User ${userId} logged out`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return;
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    await this.usersRepository.save(user);
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, passwordResetToken: token },
    });

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token expired');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.usersRepository.save(user);
  }

  async verifyEmail(token: string): Promise<void> {
    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;

    await this.usersRepository.save(user);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1d' }, // 1 día para verificar el email
    );

    user.emailVerificationToken = token;
    await this.usersRepository.save(user);

    await this.mailService.sendVerificationEmail(user.email, token);
  }

  private generateToken(user: User): { accessToken: string } {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
