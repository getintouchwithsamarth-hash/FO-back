import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { JobsService } from './jobs.service';
import { ReportProcessor } from './report.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'reports' })],
  providers: [JobsService, ReportProcessor],
  exports: [JobsService],
})
export class JobsModule {}
