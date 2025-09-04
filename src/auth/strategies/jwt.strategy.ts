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

    // Mantener compatibilidad absoluta con tests existentes
    const baseUser = { 
      userId: payload.sub, 
      email: payload.email 
    };

    // Agregar nuevos campos solo si existen en el payload
    const extendedUser = {
      ...baseUser,
      /* TODO
      ...(payload.id && { id: payload.id }),
      ...(payload.roles && { roles: payload.roles }),
      ...(payload.name && { name: payload.name }),*/
    };

    return extendedUser;
  }
  
}