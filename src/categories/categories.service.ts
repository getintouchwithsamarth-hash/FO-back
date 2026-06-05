import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';


import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesRepository } from './repositories/categories.repository';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  list(organizationId: string) {
    return this.categoriesRepository.list(organizationId);
  }

  async create(organizationId: string, userId: string, dto: CreateCategoryDto) {
    const category = await this.categoriesRepository.create(organizationId, dto);
    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'category.created',
      entityType: 'expense_category',
      entityId: category.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });
    return category;
  }

  async update(organizationId: string, id: string, userId: string, dto: UpdateCategoryDto) {
    await this.categoriesRepository.ensureExists(organizationId, id);
    const category = await this.categoriesRepository.update(organizationId, id, dto);
    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'category.updated',
      entityType: 'expense_category',
      entityId: id,
      metadata: dto as unknown as Prisma.JsonObject,
    });
    return category;
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.categoriesRepository.ensureExists(organizationId, id);
    const category = await this.categoriesRepository.softDelete(organizationId, id);
    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'category.deleted',
      entityType: 'expense_category',
      entityId: id,
    });
    return category;
  }
}
