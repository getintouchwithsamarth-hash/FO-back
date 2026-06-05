import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { JobsModule } from '@/jobs/jobs.module';
import { OrganizationsModule } from '@/organizations/organizations.module';
import { UsersModule } from '@/users/users.module';


@Module({
  imports: [UsersModule, OrganizationsModule, AuditLogsModule, JobsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
