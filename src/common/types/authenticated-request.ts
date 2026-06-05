import type { MembershipRole, PlatformRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

export interface RequestUser {
  id: string;
  email: string;
  fullName: string;
  platformRole: PlatformRole;
}

export interface RequestOrganization {
  id: string;
  role: MembershipRole;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: RequestUser;
  organization?: RequestOrganization;
}
