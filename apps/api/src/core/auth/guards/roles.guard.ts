import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If neither roles nor permissions are required, allow access
    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Super Admin always has access
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check roles
    let hasRole = false;
    if (requiredRoles && requiredRoles.length > 0) {
      if (requiredRoles.includes(user.role)) {
        hasRole = true;
      }
    }

    // Check permissions
    let hasPermission = false;
    if (requiredPermissions && requiredPermissions.length > 0) {
      const permissions = Array.isArray(user.customRole?.permissions) ? user.customRole.permissions : [];
      if (requiredPermissions.some((perm) => permissions.includes(perm))) {
        hasPermission = true;
      }
    }

    // If both are specified, meeting either condition is sufficient. If only one is specified, they must meet that condition.
    if (requiredRoles?.length && requiredPermissions?.length) {
      return hasRole || hasPermission;
    }
    
    if (requiredPermissions?.length) {
      return hasPermission;
    }

    return hasRole;
  }
}
