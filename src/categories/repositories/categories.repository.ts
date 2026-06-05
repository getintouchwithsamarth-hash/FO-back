import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  create(organizationId: string, data: { name: string; icon?: string; color?: string; type?: string; isDefault?: boolean }) {
    return this.prisma.expenseCategory.create({
      data: { organizationId, ...data },
    });
  }

  async ensureExists(organizationId: string, id: string) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  update(organizationId: string, id: string, data: Partial<{ name: string; icon: string; color: string; type: string; isDefault: boolean }>) {
    return this.prisma.expenseCategory.update({
      where: { id },
      data,
    });
  }

  softDelete(organizationId: string, id: string) {
    return this.prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
