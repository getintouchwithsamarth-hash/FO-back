import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogsRepository } from './repositories/audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  log(input: {
    organizationId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ip?: string;
    userAgent?: string;
  }) {
    return this.auditLogsRepository.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: input.metadata,
      ipAddress: input.ip,
      userAgent: input.userAgent,
    });
  }

  list(query: AuditLogQueryDto, organizationId?: string) {
    return this.auditLogsRepository.findMany(query, organizationId);
  }

  listForEntity(entityType: string, entityId: string, organizationId?: string) {
    return this.auditLogsRepository.findMany(
      {
        page: 1,
        limit: 100,
        sortOrder: 'desc',
        entityType,
        entityId,
      },
      organizationId,
    );
  }
}
