import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


@Controller('expense-categories')
@UseGuards(OrganizationScopeGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentOrganization() organization: { id: string }) {
    return this.categoriesService.list(organization.id);
  }

  @Post()
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  create(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(organization.id, user.id, dto);
  }

  @Patch(':id')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  update(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(organization.id, id, user.id, dto);
  }

  @Delete(':id')
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  remove(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(organization.id, id, user.id);
  }
}
