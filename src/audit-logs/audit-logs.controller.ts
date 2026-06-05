import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  list(
    @Query() query: AuditLogQueryDto,
    @CurrentOrganization() organization: { id: string },
  ) {
    return this.auditLogsService.list(query, organization.id);
  }
}
