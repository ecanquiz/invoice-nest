import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || configService.get('JWT_SECRET'),
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
        isEmailVerified: user.isEmailVerified,
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
