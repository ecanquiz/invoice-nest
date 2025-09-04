import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied. No permissions assigned.');
    }

    // Obtener todos los permisos del usuario
    const userPermissions = user.roles.flatMap(role => 
      role.permissions ? role.permissions.map(p => p.name) : []
    );

    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Access denied. Insufficient permissions.');
    }

    return true;
  }
}
