import { Module } from '@nestjs/common';

import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './repositories/audit-logs.repository';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
  exports: [AuditLogsService, AuditLogsRepository],
})
export class AuditLogsModule {}
