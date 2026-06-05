import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';


import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.organizationsService.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get(':id')
  getOne(@Param('id') organizationId: string, @CurrentUser() user: { id: string }) {
    return this.organizationsService.getOne(organizationId, user.id);
  }

  @Patch(':id')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  update(
    @Param('id') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.update(organizationId, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER'] })
  remove(@Param('id') organizationId: string, @CurrentUser() user: { id: string }) {
    return this.organizationsService.remove(organizationId, user.id);
  }

  @Get(':organizationId/members')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  listMembers(@Param('organizationId') organizationId: string) {
    return this.organizationsService.listMembers(organizationId);
  }

  @Post(':organizationId/members/invite')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  inviteMember(
    @Param('organizationId') organizationId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.inviteMember(organizationId, user.id, dto);
  }

  @Patch(':organizationId/members/:memberId/role')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.updateMemberRole(organizationId, memberId, dto, user.id);
  }

  @Delete(':organizationId/members/:memberId')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.removeMember(organizationId, memberId, user.id);
  }
}
