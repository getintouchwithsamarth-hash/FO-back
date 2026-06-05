import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.backgroundJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async retry(jobId: string) {
    const job = await this.prisma.backgroundJob.update({
      where: { id: jobId },
      data: { status: 'PENDING', attempts: 0, lastError: null },
    });

    return job;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async purgeFinishedJobs() {
    await this.prisma.backgroundJob.deleteMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        },
      },
    });
  }
}
