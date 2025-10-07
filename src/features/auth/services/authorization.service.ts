import { Injectable } from '@nestjs/common';
import { User } from '@features/iam/users/entities/user.entity';

@Injectable()
export class AuthorizationService {
  hasRole(user: User, roleName: string): boolean {
    console.info('Info role ', {user, roleName})
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
