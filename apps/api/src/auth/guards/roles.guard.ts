import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role hierarchy for authorization checks.
 *
 * Key  = the user's actual role
 * Value = the set of roles this user is allowed to pass for
 *
 * Design rules:
 *  - SUPERADMIN can perform any admin action (SUPERADMIN + ADMIN + EDITOR + SUPPORT)
 *  - ADMIN can perform admin + editor + support actions
 *  - EDITOR can perform editor actions only
 *  - SUPPORT can perform support actions only
 *  - CUSTOMER is strictly customer-level — never admin-level
 *
 * No cross-contamination: CUSTOMER never gets admin access, and admin roles
 * never automatically get CUSTOMER-only access (e.g. placing orders as customer).
 */
const roleHierarchy: Record<RoleType, RoleType[]> = {
  SUPERADMIN: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SUPPORT'],
  ADMIN: ['ADMIN', 'EDITOR', 'SUPPORT'],
  EDITOR: ['EDITOR'],
  SUPPORT: ['SUPPORT'],
  CUSTOMER: ['CUSTOMER'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role restriction — allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
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
    const allowedRolesForUser = roleHierarchy[userRole] ?? [userRole];

    return requiredRoles.some((role) => allowedRolesForUser.includes(role));
  }
}
