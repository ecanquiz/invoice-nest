import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../common';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UsersService } from '../../users/services/users.service';
import { MailService } from '../../mail/services/mail.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly logger: LoggerService
    // private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const { email, password, name } = registerDto;

    try {
        const existingUser = await this.usersRepository.findOne({
          where: { email, deletedAt: IsNull() } 
        });

        if (existingUser) {
          throw new BadRequestException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = this.usersRepository.create({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name: name?.trim(),
            isEmailVerified: false,
            emailVerificationToken: null,
            passwordResetToken: null,
            passwordResetExpires: null,
            roles: [] // Initialize empty array
        });

        const savedUser = await this.usersRepository.save(user);
        await this.assignDefaultRole(savedUser);
      
        // Send the email BUT don't wait for it to finish
        this.sendVerificationEmail(savedUser).catch(error => {
          this.logger.error('Error sending verification email:', error);
        });

        // Generates token but user is not fully verified
        return this.generateToken(savedUser);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create user');
    }
  }

  private async assignDefaultRole(user: User): Promise<void> {
    try {
      // Search for the "user" role
      const userRole = await this.roleRepository.findOne({ 
        where: { name: 'user', isActive: true } 
      });

      if (userRole) {
        // Assign the role to the user
        user.roles = [userRole];
        await this.usersRepository.save(user);
      } else {
        // Log warning but not failing registration        
        this.logger.warn('Default role "user" not found. User created without role.');
      }
    } catch (error) {
      // Log error but not fail registration
      this.logger.error('Error assigning default role:', error);
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: any; token: string }> {
    const { email, password: rawPassword } = loginDto;
    const password = rawPassword.trim();
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      this.logger.log('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      this.logger.log('Password does not match');      
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      this.logger.log('Email not verified');      
      throw new UnauthorizedException('Please verify your email first');
    }
    
    const { accessToken } = await this.generateToken(user);
    
    // Exclude the password from the user object
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token: accessToken
    };
  }

  async logout(authorizationHeader: string): Promise<{
    message: string, tokenExpiresIn:string
  }> {
    const token = authorizationHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    const decoded = this.jwtService.decode(token) as { sub: string, exp: number };
    const userId = decoded.sub;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    this.tokenBlacklist.add(token);
    this.logger.log(`User ${userId} logged out. Token invalidated.`);    

    return { 
      message: 'Logout successful',
      tokenExpiresIn: `${expiresIn} seconds remaining` 
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // For security reasons, we do not reveal whether the email exists or not.
      return;
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // one hour

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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.usersRepository.save(user);
  }

  async verifyEmail(token: string): Promise<{ message: string; }> {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, emailVerificationToken: token }
      });

      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      await this.usersRepository.update(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
      });
    
      return { message: 'Email successfully verified' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1d' }, // one day to verify email
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
