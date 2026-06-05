import { Module } from '@nestjs/common';

import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AttachmentsRepository } from './repositories/attachments.repository';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { ExpensesModule } from '@/expenses/expenses.module';


@Module({
  imports: [ExpensesModule, AuditLogsModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentsRepository],
  exports: [AttachmentsService, AttachmentsRepository],
})
export class AttachmentsModule {}
