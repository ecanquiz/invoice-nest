import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '@core/common';
import { MailService } from '@core/mail/services/mail.service';
import { User } from '@features/iam/users/entities/user.entity';
import { Role } from '@features/iam/roles/entities/role.entity';
import { UsersService } from '@features/iam/users/services/users.service';
import { CustomerRegistrationService } from '@features/customers/services/customer-registration.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterCustomerDto } from '../dto/register-customer.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private customerRegistrationService: CustomerRegistrationService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly customLogger: LoggerService,
    private dataSource: DataSource 
  ) {}

  async registerCustomer(registerDto: RegisterCustomerDto): Promise<{ accessToken: string }> {
    const { email, password, name, phone, birthDate, preferences } = registerDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email, deleted_at: IsNull() } 
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = queryRunner.manager.create(User, {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name?.trim(),
        is_email_verified: false,
        email_verification_token: null,
        password_reset_token: null,
        password_reset_expires: null,
        roles: []
      });

      const savedUser = await queryRunner.manager.save(User, user);

      await this.customerRegistrationService.registerCustomerWithTransaction(
        queryRunner, 
        savedUser.id, 
        { phone, birthDate, preferences }
      );

      await this._assignRoleWithTransaction(queryRunner, savedUser, 'customer');

      await queryRunner.commitTransaction();
      
      // Send verification email OUTSIDE the transaction
      // (not critical if it fails, but the user is already created)
      this.sendVerificationEmail(savedUser).catch(error => {
        this.logger.error('Error sending verification email:', error);
      }); // Send the email BUT don't wait for it to finish

      return this.generateToken(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Customer registration error:', error);
      throw new InternalServerErrorException('Could not create customer account');
    } finally { // Release the query runner
      await queryRunner.release();
    }
  }

  private async _assignRoleWithTransaction(
    queryRunner: any, 
    user: User, 
    roleName: string
  ): Promise<void> {
    try {
      const role = await queryRunner.manager.findOne(Role, { 
        where: { name: roleName, is_active: true } 
      });

      if (role) {
        user.roles = [role];
        await queryRunner.manager.save(User, user);
      } else {
        this.logger.warn(`Role "${roleName}" not found. User created without role.`);
      }
    } catch (error) {
      this.logger.error('Error assigning role in transaction:', error);
      throw error; // Propagate the error so the transaction is rolled back
    }
  }

  private async assignRole(user: User, roleName: string): Promise<void> {
    try {
      // Search for the role
      const role = await this.roleRepository.findOne({ 
        where: { name: roleName, is_active: true } 
      });

      if (role) {
        // Assign the role to the user
        user.roles = [role];
        await this.usersRepository.save(user);
      } else {
        // Log warning but not failing registration        
        this.logger.warn(`Default role "${roleName}" not found. User created without role.`);
      }
    } catch (error) {
      // Log error but not fail registration
      this.logger.error('Error assigning role:', error);
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

    if (!user.is_email_verified) {
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
    user.password_reset_token = resetToken;
    user.password_reset_expires = new Date(Date.now() + 3600000); // one hour

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
      where: { id: payload.sub, password_reset_token: token },
    });

    if (!user || !user.password_reset_token || !user.password_reset_expires) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (user.password_reset_expires && user.password_reset_expires < new Date()) {
      throw new BadRequestException('Token expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null;

    await this.usersRepository.save(user);
  }

  async verifyEmail(token: string): Promise<{ message: string; }> {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, email_verification_token: token }
      });

      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      await this.usersRepository.update(user.id, {
        is_email_verified: true,
        email_verification_token: null,
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

    user.email_verification_token = token;
    await this.usersRepository.save(user);

    await this.mailService.sendVerificationEmail(user.email, token);
  }

  private generateToken(user: User): { accessToken: string } {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Check if the email already exists (if it is being updated)
    if (updateProfileDto.email) {
      const existingUser = await this.usersService.findByEmail(updateProfileDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('The email is already in use');
      }
    }

    // Hash the new password if provided
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(updateProfileDto.password, 10);
    }

    // Update profile
    const updatedUser = await this.usersService.update(userId, updateProfileDto);
    
    // Delete sensitive information before returning it
    const { password, ...user } = updatedUser;
    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    // Validate that the new passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('The new passwords do not match');
    }

    // Search user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('The current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.usersService.update(userId, { password: hashedPassword });

    return { message: 'Contraseña actualizada correctamente' };
  }
}
