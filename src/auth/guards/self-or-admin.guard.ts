import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.id;

    // Permitir si es el mismo usuario o si es admin
    const isSelf = user.id === targetUserId;
    const isAdmin = user.roles?.some(role => role.name === 'admin');

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only access your own data');
    }

    return true;
  }
}
