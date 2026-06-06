import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';


import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateMemberDto } from './dto/invite-member.dto';
import { UpdateMemberCredentialsDto } from './dto/update-member-credentials.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsRepository } from './repositories/organizations.repository';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  listForUser(userId: string) {
    return this.organizationsRepository.listByUserId(userId);
  }

  create(userId: string, dto: CreateOrganizationDto) {
    return this.organizationsRepository.create(userId, dto);
  }

  getOne(organizationId: string, userId: string) {
    return this.organizationsRepository.getByIdForUser(organizationId, userId);
  }

  async update(organizationId: string, dto: UpdateOrganizationDto, actorUserId: string) {
    const updated = await this.organizationsRepository.update(organizationId, dto);
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'organization.updated',
      entityType: 'organization',
      entityId: organizationId,
      metadata: dto as unknown as Prisma.JsonObject,
    });
    return updated;
  }

  async remove(organizationId: string, actorUserId: string) {
    const deleted = await this.organizationsRepository.softDelete(organizationId);
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'organization.deleted',
      entityType: 'organization',
      entityId: organizationId,
    });
    return deleted;
  }

  listMembers(organizationId: string) {
    return this.organizationsRepository.listMembers(organizationId);
  }

  async createMember(organizationId: string, actorUserId: string, dto: CreateMemberDto) {
    const member = await this.organizationsRepository.createMember(
      organizationId,
      actorUserId,
      dto,
    );
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'user.created',
      entityType: 'organization_member',
      entityId: member.member.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });
    return member;
  }

  async updateMemberCredentials(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberCredentialsDto,
    actorUserId: string,
  ) {
    const member = await this.organizationsRepository.updateMemberCredentials(
      organizationId,
      memberId,
      actorUserId,
      dto,
    );
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'organization_member.credentials_updated',
      entityType: 'organization_member',
      entityId: memberId,
      metadata: {
        username: dto.username,
        email: dto.email,
        fullName: dto.fullName,
        passwordUpdated: Boolean(dto.password),
      },
    });
    return member;
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    actorUserId: string,
  ) {
    const member = await this.organizationsRepository.updateMemberRole(
      organizationId,
      memberId,
      dto.role,
      actorUserId,
    );
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'organization_member.role_updated',
      entityType: 'organization_member',
      entityId: memberId,
      metadata: dto as unknown as Prisma.JsonObject,
    });
    return member;
  }

  async removeMember(organizationId: string, memberId: string, actorUserId: string) {
    const member = await this.organizationsRepository.removeMember(organizationId, memberId, actorUserId);
    await this.auditLogsService.log({
      organizationId,
      userId: actorUserId,
      action: 'organization_member.removed',
      entityType: 'organization_member',
      entityId: memberId,
    });
    return member;
  }
}
