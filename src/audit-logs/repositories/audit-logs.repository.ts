import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

import { buildPagination } from '@/common/utils/pagination';
import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    organizationId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadataJson?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadataJson: data.metadataJson,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findMany(query: AuditLogQueryDto, organizationId?: string) {
    const page = query.page;
    const limit = query.limit;
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: items,
      pagination: buildPagination(page, limit, total),
    };
  }
}
