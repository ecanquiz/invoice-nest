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
import { Public } from '../decorators/public.decorator';
import { LoggerService } from '../../common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcrypt';
 //import type { AuthenticatedRequest } from '../../common/types/express';
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
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {}

  @ApiOperation({ summary: 'New user registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already in use or invalid data' })
  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
  @ApiBearerAuth() // Indicates that authentication is required
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    // @Req() req: AuthenticatedRequest,
    @Headers('authorization') authHeader: string
  ) {  
    try {
      const result = await this.authService.logout(
        authHeader
        //, req.user.id
      );
      return result;
    } catch (error) {
      this.logger.error('Logout error:', error);      
      throw error;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Req() req) {
    // Delete sensitive information before returning as 'resetPasswordToken', ect.
    const { password, roles, ...user } = req.user;
    return user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('profile/password')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
