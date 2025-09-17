import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { CommonModule } from '../common/common.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, Role]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '1h'},
      }),
    }),
    ConfigModule.forFeature(jwtConfig),
    forwardRef(() => UsersModule),
    MailModule
  ],
  providers: [AuthService, JwtStrategy, TokenBlacklistService, JwtAuthGuard, RolesGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, TokenBlacklistService, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
