import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@features/iam/users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get('jwt.secret') || configService.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT secret is not defined in configuration');
    }
 
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret as string,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      // Search for user with their roles and permissions
      const user = await this.usersService.findById(payload.sub);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        isEmailVerified: user.is_email_verified,
      };
    } catch (error) {
      return { 
        id: payload.sub, 
        email: payload.email,
        roles: payload.roles || [] 
      };
    }
  }
}
