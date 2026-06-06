import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, PlatformRole, UserStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByEmailOrThrow(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsernameOrThrow(username: string) {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findActiveById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null, status: UserStatus.ACTIVE },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdWithSecrets(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  createUserWithWorkspace(input: {
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    organizationName: string;
    organizationSlug: string;
    defaultCurrency: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          fullName: input.fullName,
          platformRole: PlatformRole.USER,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug,
          defaultCurrency: input.defaultCurrency,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MembershipRole.OWNER,
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      return { user, organization };
    });
  }

  updateRefreshToken(userId: string, refreshTokenHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  clearRefreshToken(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });
  }

  createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.passwordResetToken.create({ data: input });
  }

  findActivePasswordResetTokens() {
    return this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
      },
    });
  }

  consumePasswordResetToken(id: string) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  listAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}
