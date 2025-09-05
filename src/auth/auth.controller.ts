import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
  Headers
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedRequest } from '../common/types/express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Auth') // Group all endpoints under 'Auth' in Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'New user registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already in use or invalid data' })
  @Post('signup')
  @Public()
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email' })
  @Post('signin')
  @Public()
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @ApiOperation({ summary: 'Request password recovery' })
  @ApiResponse({ status: 200, description: 'Recovery email sent (if email exists)' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @ApiQuery({ name: 'token', required: true, description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Log out and invalidate token' })
  @ApiBearerAuth() // Indicates that authentication is required
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Req() req: AuthenticatedRequest,
    @Headers('authorization') authHeader: string
  ) {  
    try {
      const result = await this.authService.logout(authHeader, req.user.id);
      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Logout error:', error);
      }
      throw error;
    }
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
