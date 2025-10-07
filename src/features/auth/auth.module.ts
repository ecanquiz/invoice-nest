import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@core/common/common.module';
import { MailModule } from '@core/mail/mail.module';
import { User } from '@features/iam/users/entities/user.entity';
import { Role } from '@features/iam/roles/entities/role.entity';
import { UsersModule } from '@features/iam/users/users.module';
import { Customer } from '@features/customers/entities/customer.entity';
import { CustomerProfile } from '@features/customers/profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from '@features/customers/preferences/communications/entities/customer-communication-preference.entity';
import { CustomerWinePreference } from '@features/customers/preferences/wines/entities/customer-wine-preference.entity';
import { CustomersModule } from '@features/customers/customers.module'; 
import jwtConfig from './config/jwt.config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      User, 
      Role,
      Customer,
      CustomerProfile,
      CustomerCommunicationPreference,
      CustomerWinePreference,
    ]),
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
    forwardRef(() => CustomersModule),
    MailModule
  ],
  providers: [AuthService, JwtStrategy, TokenBlacklistService, JwtAuthGuard, RolesGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, TokenBlacklistService, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}