import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';


import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDecisionDto } from './dto/expense-decision.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';

@Controller('expenses')
@UseGuards(OrganizationScopeGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Query() query: ExpenseQueryDto,
  ) {
    return this.expensesService.list(organization.id, { id: user.id, role: organization.role }, query);
  }

  @Post()
  create(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(organization.id, user.id, dto);
  }

  @Get(':id/history')
  history(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.expensesService.getHistory(organization.id, id, { id: user.id, role: organization.role });
  }

  @Get(':id')
  getOne(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.expensesService.getOne(organization.id, id, { id: user.id, role: organization.role });
  }

  @Post(':id/approve')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  approve(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ExpenseDecisionDto,
  ) {
    return this.expensesService.approve(organization.id, id, { id: user.id, role: organization.role }, dto);
  }

  @Post(':id/reject')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  reject(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ExpenseDecisionDto,
  ) {
    return this.expensesService.reject(organization.id, id, { id: user.id, role: organization.role }, dto);
  }

  @Patch(':id')
  update(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(organization.id, id, { id: user.id, role: organization.role }, dto);
  }

  @Delete(':id')
  remove(
    @CurrentOrganization() organization: { id: string; role: MembershipRole },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(organization.id, id, { id: user.id, role: organization.role });
  }
}
