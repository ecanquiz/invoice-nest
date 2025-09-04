import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthorizationService {
  hasRole(user: User, roleName: string): boolean {
    return user.roles.some(role => role.name === roleName);
  }

  hasPermission(user: User, permissionName: string): boolean {
    return user.roles.some(role => 
      role.permissions.some(permission => permission.name === permissionName)
    );
  }

  getUsersPermissions(user: User): string[] {
    return user.roles.flatMap(role => 
      role.permissions.map(permission => permission.name)
    );
  }
}
