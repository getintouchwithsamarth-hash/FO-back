import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';

import { ROLES_KEY, type RoleOptions } from '@/common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
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
      if (!request.organization && request.user.platformRole !== PlatformRole.SUPER_ADMIN) {
        const params = (request.params ?? {}) as Record<string, string | undefined>;
        const organizationId =
          (request.headers['x-organization-id'] as string | undefined) ??
          params.organizationId ??
          params.id;

        if (organizationId) {
          const membership = await this.prisma.organizationMember.findFirst({
            where: {
              organizationId,
              userId: request.user.id,
              status: 'ACTIVE',
              organization: {
                deletedAt: null,
              },
            },
            select: {
              organizationId: true,
              role: true,
            },
          });

          if (membership) {
            request.organization = {
              id: membership.organizationId,
              role: membership.role,
            };
          }
        }
      }

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
