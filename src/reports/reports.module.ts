import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';


import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'reports' }), AuditLogsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
