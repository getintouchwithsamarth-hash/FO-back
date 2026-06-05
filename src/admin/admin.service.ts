import { Injectable } from '@nestjs/common';
import { SubscriptionStatus, UserStatus } from '@prisma/client';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { JobsService } from '@/jobs/jobs.service';
import { OrganizationsRepository } from '@/organizations/repositories/organizations.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersRepository } from '@/users/repositories/users.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly jobsService: JobsService,
    private readonly prisma: PrismaService,
  ) {}

  listUsers() {
    return this.usersRepository.listAllUsers();
  }

  getUser(id: string) {
    return this.usersRepository.findByIdWithSecrets(id);
  }

  updateUserStatus(id: string, status: string) {
    return this.usersRepository.updateStatus(id, status as UserStatus);
  }

  listOrganizations() {
    return this.organizationsRepository.listAllOrganizations();
  }

  getOrganization(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  updateOrganizationStatus(id: string, status: string) {
    return this.prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: status as SubscriptionStatus },
    });
  }

  getAuditLogs() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  getSystemHealth() {
    return {
      status: 'ok',
      time: new Date().toISOString(),
    };
  }

  getJobs() {
    return this.jobsService.list();
  }

  retryJob(id: string) {
    return this.jobsService.retry(id);
  }

  getFeatureFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  updateFeatureFlag(key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled },
      create: { key, enabled },
    });
  }
}
