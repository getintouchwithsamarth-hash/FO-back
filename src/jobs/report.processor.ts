import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { PrismaService } from '@/prisma/prisma.service';

@Processor('reports')
export class ReportProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ reportId: string; organizationId: string; userId: string }>) {
    await this.prisma.backgroundJob.create({
      data: {
        organizationId: job.data.organizationId,
        type: job.name,
        payloadJson: job.data,
        status: 'PROCESSING',
        attempts: job.attemptsMade,
      },
    });

    await this.prisma.report.update({
      where: { id: job.data.reportId },
      data: {
        status: 'COMPLETED',
        fileKey: `${job.data.organizationId}/reports/${job.data.reportId}.csv`,
        completedAt: new Date(),
      },
    });
  }
}
