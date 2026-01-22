import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../types/auth-roles.types';
import { ModuleRoleThreshold } from '../decorators/user-access.decorator';

@Injectable()
export class UserPermissionGuard implements CanActivate {
  private readonly logger = new Logger(UserPermissionGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const userPerms = user?.permissions as { module: string; role: keyof typeof Role }[];
    if (!userPerms) return false;

    const required = this.reflector.get<ModuleRoleThreshold[]>(
      'userPermissions',
      context.getHandler(),
    );
    if (!required?.length) return true;

    const canActivate =  required.some(({ module, roles }) => {
      // Check if user has any of the required roles for this module
      return userPerms.some((p) =>
        p.module === module && roles.includes(p.role)
      );
    });
    this.logger.debug({canActivate, required, userPerms});
    return canActivate;
  }
}

