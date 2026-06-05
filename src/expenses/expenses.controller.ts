import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';


import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';

@Controller('expenses')
@UseGuards(OrganizationScopeGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(@CurrentOrganization() organization: { id: string }, @Query() query: ExpenseQueryDto) {
    return this.expensesService.list(organization.id, query);
  }

  @Post()
  create(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(organization.id, user.id, dto);
  }

  @Get(':id')
  getOne(@CurrentOrganization() organization: { id: string }, @Param('id') id: string) {
    return this.expensesService.getOne(organization.id, id);
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
