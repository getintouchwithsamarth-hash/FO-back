import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


@Controller('reports')
@UseGuards(OrganizationScopeGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('export')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  create(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(organization.id, user.id, dto);
  }

  @Get()
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  list(@CurrentOrganization() organization: { id: string }) {
    return this.reportsService.list(organization.id);
  }

  @Get(':id')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  getOne(@CurrentOrganization() organization: { id: string }, @Param('id') id: string) {
    return this.reportsService.getOne(organization.id, id);
  }
}
