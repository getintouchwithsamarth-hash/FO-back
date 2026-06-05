import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, UserStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMembershipsByUserId(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        organization: { deletedAt: null },
      },
      include: {
        organization: true,
      },
    });
  }

  create(userId: string, data: { name: string; slug: string; defaultCurrency: string }) {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data });
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      return organization;
    });
  }

  listByUserId(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: { userId, status: MembershipStatus.ACTIVE, organization: { deletedAt: null } },
      include: { organization: true },
    });
  }

  async getByIdForUser(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: MembershipStatus.ACTIVE,
        organization: { deletedAt: null },
      },
      include: {
        organization: true,
      },
    });
    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return membership.organization;
  }

  update(organizationId: string, data: { name?: string; logoUrl?: string; defaultCurrency?: string }) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  softDelete(organizationId: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: new Date() },
    });
  }

  listMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId, status: { not: MembershipStatus.REMOVED } },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(organizationId: string, invitedById: string, email: string, role: string) {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            passwordHash: 'INVITED_ACCOUNT',
            fullName: email.split('@')[0],
            status: UserStatus.INVITED,
          },
        });
      }

      return tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: user.id,
          },
        },
        update: {
          role: role as never,
          status: MembershipStatus.INVITED,
          invitedById,
        },
        create: {
          organizationId,
          userId: user.id,
          role: role as never,
          status: MembershipStatus.INVITED,
          invitedById,
        },
      });
    });
  }

  updateMemberRole(organizationId: string, memberId: string, role: string) {
    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: role as never },
    });
  }

  removeMember(organizationId: string, memberId: string) {
    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { status: MembershipStatus.REMOVED },
    });
  }

  listAllOrganizations() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
