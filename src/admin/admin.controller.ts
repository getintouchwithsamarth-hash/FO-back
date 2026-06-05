import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';


import { AdminService } from './admin.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

import { Roles } from '@/common/decorators/roles.decorator';

@Controller('admin')
@Roles({ platform: ['SUPER_ADMIN'] })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Get('organizations')
  listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.adminService.getOrganization(id);
  }

  @Patch('organizations/:id/status')
  updateOrganizationStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateOrganizationStatus(id, dto.status);
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('system-health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('jobs')
  getJobs() {
    return this.adminService.getJobs();
  }

  @Post('jobs/:id/retry')
  retryJob(@Param('id') id: string) {
    return this.adminService.retryJob(id);
  }

  @Get('feature-flags')
  getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Patch('feature-flags/:key')
  updateFeatureFlag(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.adminService.updateFeatureFlag(key, dto.enabled);
  }
}
