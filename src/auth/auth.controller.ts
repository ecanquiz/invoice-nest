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
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedRequest } from '../common/types/express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

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

  @Get('test-bcrypt')
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
