import { Module, forwardRef } from '@nestjs/common';


import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './repositories/organizations.repository';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';

@Module({
  imports: [forwardRef(() => AuditLogsModule)],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService, OrganizationsRepository],
})
export class OrganizationsModule {}
