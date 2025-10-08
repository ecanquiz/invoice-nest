import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('Roles api ', user);
    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied. No roles assigned.');
    }

    const hasRole = user.roles.some(role => requiredRoles.includes(role.name));
     console.log('Roles has ', hasRole);
    if (!hasRole) {
      throw new ForbiddenException('Access denied. Insufficient permissions.');
    }

    return true;
  }
}
