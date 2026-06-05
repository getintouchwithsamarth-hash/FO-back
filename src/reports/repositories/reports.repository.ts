import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportStatus, ReportType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, createdByUserId: string, reportType: ReportType, filters: Record<string, unknown>) {
    return this.prisma.report.create({
      data: {
        organizationId,
        createdByUserId,
        reportType,
        filtersJson: filters as Prisma.InputJsonValue,
      },
    });
  }

  list(organizationId: string) {
    return this.prisma.report.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const report = await this.prisma.report.findFirst({
      where: { organizationId, id, deletedAt: null },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  updateStatus(
    id: string,
    data: { status: ReportStatus; fileKey?: string; errorMessage?: string; completedAt?: Date },
  ) {
    return this.prisma.report.update({ where: { id }, data });
  }
}
