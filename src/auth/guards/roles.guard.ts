import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, type RoleOptions } from '@/common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roleOptions = this.reflector.getAllAndOverride<RoleOptions | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roleOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    if (roleOptions.platform?.includes(request.user.platformRole)) {
      return true;
    }

    if (roleOptions.membership?.length) {
      if (!request.organization) {
        throw new ForbiddenException('Organization context missing for this action');
      }

      if (!roleOptions.membership.includes(request.organization.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
