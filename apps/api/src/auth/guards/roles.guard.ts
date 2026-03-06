import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

const roleHierarchy: Record<RoleType, RoleType[]> = {
  SUPERADMIN: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SUPPORT', 'CUSTOMER'],
  ADMIN: ['ADMIN', 'EDITOR', 'SUPPORT', 'CUSTOMER'],
  EDITOR: ['EDITOR', 'CUSTOMER'],
  SUPPORT: ['SUPPORT', 'CUSTOMER'],
  CUSTOMER: ['CUSTOMER'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: { name?: RoleType } } }>();
    const user = request.user;

    if (!user || !user.role || !user.role.name) {
      return false;
    }

    const userRole = user.role.name;
    const allowedRolesForUser = roleHierarchy[userRole] || [userRole];

    return requiredRoles.some((role) => allowedRolesForUser.includes(role));
  }
}
