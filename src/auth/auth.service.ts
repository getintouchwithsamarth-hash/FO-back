import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import crypto from 'node:crypto';


import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import type { RequestUser } from '@/common/types/authenticated-request';
import { OrganizationsRepository } from '@/organizations/repositories/organizations.repository';
import { UsersRepository } from '@/users/repositories/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async register(dto: RegisterDto, requestMeta?: { ip?: string; userAgent?: string }) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { user, organization } = await this.usersRepository.createUserWithWorkspace({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      organizationName: dto.organizationName,
      organizationSlug: dto.organizationSlug,
      defaultCurrency: dto.defaultCurrency,
    });

    const tokens = await this.issueTokens(user.id, user.email);
    await this.usersRepository.updateRefreshToken(user.id, await bcrypt.hash(tokens.refreshToken, 10));
    await this.auditLogsService.log({
      organizationId: organization.id,
      userId: user.id,
      action: 'auth.registered',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
      ...requestMeta,
    });

    return { user, organization, tokens };
  }

  async login(dto: LoginDto, requestMeta?: { ip?: string; userAgent?: string }) {
    const user = await this.usersRepository.findByEmailOrThrow(dto.email);

    if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.auditLogsService.log({
        action: 'login.failed',
        entityType: 'user',
        entityId: user.id,
        metadata: { email: user.email },
        ...requestMeta,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.usersRepository.updateLastLogin(user.id);
    await this.usersRepository.updateRefreshToken(user.id, await bcrypt.hash(tokens.refreshToken, 10));
    await this.auditLogsService.log({
      action: 'login.success',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
      ...requestMeta,
    });

    return { user: this.stripSecrets(user), tokens };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(dto.refreshToken, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });

    const user = await this.usersRepository.findByIdWithSecrets(payload.sub);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is not registered');
    }

    const matches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.usersRepository.updateRefreshToken(user.id, await bcrypt.hash(tokens.refreshToken, 10));
    return { tokens };
  }

  async logout(userId: string) {
    await this.usersRepository.clearRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the account exists, a reset email will be sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.usersRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: await bcrypt.hash(rawToken, 10),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    return {
      message: 'Password reset token generated',
      resetToken: rawToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokens = await this.usersRepository.findActivePasswordResetTokens();
    const matchedToken = await this.findMatchingResetToken(dto.token, tokens);
    if (!matchedToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.usersRepository.updatePassword(matchedToken.userId, await bcrypt.hash(dto.password, 10));
    await this.usersRepository.consumePasswordResetToken(matchedToken.id);
    return { message: 'Password updated successfully' };
  }

  async getProfile(user: RequestUser) {
    const memberships = await this.organizationsRepository.findMembershipsByUserId(user.id);
    return { ...user, memberships };
  }

  private async findMatchingResetToken(
    token: string,
    entries: { id: string; tokenHash: string; userId: string }[],
  ) {
    for (const entry of entries) {
      if (await bcrypt.compare(token, entry.tokenHash)) {
        return entry;
      }
    }

    return null;
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.accessTtl') as never,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.refreshTtl') as never,
    });

    return { accessToken, refreshToken };
  }

  private stripSecrets<T extends { passwordHash?: string | null; refreshTokenHash?: string | null }>(
    user: T,
  ) {
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    delete safeUser.refreshTokenHash;
    return safeUser;
  }
}
