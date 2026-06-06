import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, MembershipStatus, UserStatus, type PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type { CreateMemberDto } from '../dto/invite-member.dto';
import type { UpdateMemberCredentialsDto } from '../dto/update-member-credentials.dto';

import { PrismaService } from '@/prisma/prisma.service';

type MemberRecord = Awaited<ReturnType<OrganizationsRepository['getMemberRecord']>>;
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends' | '$use'
>;

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

  async listMembers(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId, status: { not: MembershipStatus.REMOVED } },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((member) => this.serializeMember(member));
  }

  async createMember(organizationId: string, actorUserId: string, input: CreateMemberDto) {
    return this.prisma.$transaction(async (tx) => {
      const actorMembership = await this.getActiveMembership(tx, organizationId, actorUserId);
      this.assertActorCanManage(actorMembership.role);

      const username = this.normalizeUsername(input.username);
      await this.assertUsernameAvailable(tx, username);
      if (input.email) {
        await this.assertEmailAvailable(tx, input.email);
      }

      const user = await tx.user.create({
        data: {
          username,
          email: input.email?.trim().toLowerCase() || null,
          passwordHash: await bcrypt.hash(input.password, 10),
          fullName: input.fullName?.trim() || input.username,
          status: UserStatus.ACTIVE,
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: input.role,
          status: MembershipStatus.ACTIVE,
          invitedById: actorUserId,
          joinedAt: new Date(),
        },
        include: { user: true },
      });

      return {
        member: this.serializeMember(member),
        credentials: {
          username,
          password: input.password,
        },
      };
    });
  }

  async updateMemberCredentials(
    organizationId: string,
    memberId: string,
    actorUserId: string,
    input: UpdateMemberCredentialsDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const actorMembership = await this.getActiveMembership(tx, organizationId, actorUserId);
      this.assertActorCanManage(actorMembership.role);

      const member = await this.getMemberRecord(tx, organizationId, memberId);
      this.assertTargetCanBeManaged(member);

      const userData: {
        username?: string;
        email?: string | null;
        fullName?: string;
        passwordHash?: string;
        refreshTokenHash?: null;
      } = {};

      if (input.username) {
        const username = this.normalizeUsername(input.username);
        await this.assertUsernameAvailable(tx, username, member.userId);
        userData.username = username;
      }

      if (typeof input.email !== 'undefined') {
        const email = input.email?.trim().toLowerCase() ?? '';
        if (email) {
          await this.assertEmailAvailable(tx, email, member.userId);
          userData.email = email;
        } else {
          userData.email = null;
        }
      }

      if (input.fullName) {
        userData.fullName = input.fullName.trim();
      }

      if (input.password) {
        userData.passwordHash = await bcrypt.hash(input.password, 10);
        userData.refreshTokenHash = null;
      }

      const updated = await tx.organizationMember.update({
        where: { id: member.id },
        data: {
          user: {
            update: userData,
          },
        },
        include: { user: true },
      });

      return this.serializeMember(updated);
    });
  }

  async updateMemberRole(organizationId: string, memberId: string, role: string, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const actorMembership = await this.getActiveMembership(tx, organizationId, actorUserId);
      this.assertActorCanManage(actorMembership.role);

      const member = await this.getMemberRecord(tx, organizationId, memberId);
      this.assertTargetCanBeManaged(member);

      const updated = await tx.organizationMember.update({
        where: { id: memberId },
        data: { role: role as MembershipRole },
        include: { user: true },
      });

      return this.serializeMember(updated);
    });
  }

  async removeMember(organizationId: string, memberId: string, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const actorMembership = await this.getActiveMembership(tx, organizationId, actorUserId);
      this.assertActorCanManage(actorMembership.role);

      const member = await this.getMemberRecord(tx, organizationId, memberId);
      this.assertTargetCanBeManaged(member);

      const removed = await tx.organizationMember.update({
        where: { id: memberId },
        data: { status: MembershipStatus.REMOVED },
        include: { user: true },
      });

      return this.serializeMember(removed);
    });
  }

  listAllOrganizations() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  private normalizeUsername(value: string) {
    return value.trim().toLowerCase();
  }

  private async getActiveMembership(tx: PrismaTransaction, organizationId: string, userId: string) {
    const membership = await tx.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    return membership;
  }

  private async getMemberRecord(tx: PrismaTransaction, organizationId: string, memberId: string) {
    const member = await tx.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        status: { not: MembershipStatus.REMOVED },
      },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  private async assertUsernameAvailable(tx: PrismaTransaction, username: string, excludeUserId?: string) {
    const existing = await tx.user.findUnique({ where: { username } });
    if (existing && existing.id !== excludeUserId) {
      throw new BadRequestException('Username is already in use');
    }
  }

  private async assertEmailAvailable(tx: PrismaTransaction, email: string, excludeUserId?: string) {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing && existing.id !== excludeUserId) {
      throw new BadRequestException('Email is already in use');
    }
  }

  private assertActorCanManage(role: MembershipRole) {
    if (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to manage members');
    }
  }

  private assertTargetCanBeManaged(member: MemberRecord) {
    if (member.role === MembershipRole.OWNER) {
      throw new ForbiddenException('Owner accounts cannot be modified from member management');
    }
  }

  private serializeMember(member: {
    id: string;
    organizationId: string;
    userId: string;
    role: MembershipRole;
    status: MembershipStatus;
    invitedById: string | null;
    createdAt: Date;
    joinedAt: Date | null;
    user: {
      username: string;
      email: string | null;
      fullName: string;
    };
  }) {
    return {
      id: member.id,
      userId: member.userId,
      workspaceId: member.organizationId,
      username: member.user.username,
      email: member.user.email,
      fullName: member.user.fullName,
      role: member.role,
      status: member.status === MembershipStatus.ACTIVE ? 'active' : 'invited',
      invitedAt: member.createdAt.toISOString(),
      joinedAt: member.joinedAt?.toISOString() ?? null,
      invitedBy: member.invitedById,
    };
  }
}
