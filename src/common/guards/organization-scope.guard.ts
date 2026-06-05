import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

import type { AuthenticatedRequest } from '../types/authenticated-request';

import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    if (request.user.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const params = (request.params ?? {}) as Record<string, string | undefined>;
    const organizationId =
      (request.headers['x-organization-id'] as string | undefined) ??
      params.organizationId ??
      params.id;

    if (!organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

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

    if (!membership) {
      throw new ForbiddenException('Organization access denied');
    }

    request.organization = {
      id: membership.organizationId,
      role: membership.role,
    };

    return true;
  }
}
