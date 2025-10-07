import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Query,
  UseGuards,
  Headers,
  Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '@core/common';
import { Public } from '../decorators/public.decorator';
import { AuthService } from '../services/auth.service';
import { RegisterCustomerDto } from '../dto/register-customer.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {}

  @ApiOperation({ summary: 'Customer registration' })
  @ApiResponse({ status: 201, description: 'Customer successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already in use or invalid data' })
  @Post('register/customer')
  @Public()
  async registerCustomer(@Body() registerCustomerDto: RegisterCustomerDto) {
    console.log('🔐 [Nest] Customer register endpoint called with:', registerCustomerDto);
    return this.authService.registerCustomer(registerCustomerDto);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email' })
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Request password recovery' })
  @ApiResponse({ status: 200, description: 'Recovery email sent (if email exists)' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Post('reset-password')
  @Public()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @ApiQuery({ name: 'token', required: true, description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Get('verify-email')
  @Public()
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Log out and invalidate token' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Headers('authorization') authHeader: string
  ) {  
    try {
      const result = await this.authService.logout(authHeader);
      return result;
    } catch (error) {
      this.logger.error('Logout error:', error);      
      throw error;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    // Delete sensitive information before returning as 'resetPasswordToken', etc.
    const { password, roles, ...user } = req.user;
    return user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('profile/password')
  @ApiOperation({ summary: 'Change the password of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @ApiOperation({ summary: 'Testing bcrypt functionality' })
  @ApiResponse({ status: 200, description: 'bcrypt test results' })  
  @Get('test-bcrypt')
  @Public()
  async testBcrypt() {
    const plain = 'Password123';
    const hash = await bcrypt.hash(plain, 10);
    const match = await bcrypt.compare(plain, hash);
    
    return {
      original: plain,
      hash,
      match, // Should be true
      sameAsStored: await bcrypt.compare(plain, '$2b$10$Fd/ZTCTunWIYSUFl0fKide7cr.vGOynCVwbB0zm22amciDIBF0fou')
    };
  }
}
