import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsRepository } from './repositories/reports.repository';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { StorageService } from '@/storage/storage.service';


@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly storageService: StorageService,
    @InjectQueue('reports') private readonly reportsQueue: Queue,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateReportDto) {
    const report = await this.reportsRepository.create(
      organizationId,
      userId,
      dto.reportType,
      dto.filters,
    );

    await this.reportsQueue.add('export-report', {
      reportId: report.id,
      organizationId,
      userId,
    });

    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'report.exported',
      entityType: 'report',
      entityId: report.id,
      metadata: dto.filters as Prisma.JsonObject,
    });

    return report;
  }

  list(organizationId: string) {
    return this.reportsRepository.list(organizationId);
  }

  async getOne(organizationId: string, id: string) {
    const report = await this.reportsRepository.findOne(organizationId, id);
    return {
      ...report,
      downloadUrl: report.fileKey ? await this.storageService.createDownloadUrl(report.fileKey) : null,
    };
  }
}
