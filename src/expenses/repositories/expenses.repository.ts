import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, Prisma } from '@prisma/client';

import { ExpenseQueryDto } from '../dto/expense-query.dto';

import { buildPagination } from '@/common/utils/pagination';
import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    organizationId: string,
    actor: { id: string; role: MembershipRole },
    query: ExpenseQueryDto,
  ) {
    const where: Prisma.ExpenseWhereInput = {
      organizationId,
      deletedAt: null,
      createdByUserId: actor.role === MembershipRole.MEMBER ? actor.id : undefined,
      title: query.search
        ? {
            contains: query.search,
            mode: 'insensitive',
          }
        : undefined,
      categoryId: query.categoryId,
      currency: query.currency,
      paymentMethod: query.paymentMethod,
      status: query.status,
      expenseDate:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder.toLowerCase() as Prisma.SortOrder }
      : { expenseDate: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: items,
      pagination: buildPagination(query.page, query.limit, total),
    };
  }

  async findOne(organizationId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  assertViewable(
    expense: { createdByUserId: string },
    actor: { id: string; role: MembershipRole },
  ) {
    if (actor.role !== MembershipRole.MEMBER) {
      return expense;
    }

    if (expense.createdByUserId !== actor.id) {
      throw new ForbiddenException('You cannot view this expense');
    }

    return expense;
  }

  create(
    organizationId: string,
    createdByUserId: string,
    data: Prisma.ExpenseUncheckedCreateInput,
    tagNames: string[] = [],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({ data: { ...data, organizationId, createdByUserId } });

      if (tagNames.length) {
        for (const tagName of tagNames) {
          const tag = await tx.expenseTag.upsert({
            where: {
              organizationId_name: {
                organizationId,
                name: tagName,
              },
            },
            update: {},
            create: {
              organizationId,
              name: tagName,
            },
          });

          await tx.expenseTagLink.create({
            data: { expenseId: expense.id, tagId: tag.id },
          });
        }
      }

      return expense;
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: Prisma.ExpenseUncheckedUpdateInput,
    tagNames?: string[],
  ) {
    await this.findOne(organizationId, id);

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data,
      });

      if (tagNames) {
        await tx.expenseTagLink.deleteMany({ where: { expenseId: id } });
        for (const tagName of tagNames) {
          const tag = await tx.expenseTag.upsert({
            where: {
              organizationId_name: {
                organizationId,
                name: tagName,
              },
            },
            update: {},
            create: { organizationId, name: tagName },
          });
          await tx.expenseTagLink.create({ data: { expenseId: id, tagId: tag.id } });
        }
      }

      return expense;
    });
  }

  softDelete(organizationId: string, id: string) {
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assertEditable(
    organizationId: string,
    expenseId: string,
    actor: { id: string; role: MembershipRole },
  ) {
    const expense = await this.findOne(organizationId, expenseId);
    this.assertViewable(expense, actor);
    const canManageAny = ([MembershipRole.OWNER, MembershipRole.ADMIN] as MembershipRole[]).includes(
      actor.role,
    );
    const canManageOwn = actor.role === MembershipRole.MEMBER && expense.createdByUserId === actor.id;

    if (!canManageAny && !canManageOwn) {
      throw new ForbiddenException('You cannot modify this expense');
    }

    return expense;
  }
}
