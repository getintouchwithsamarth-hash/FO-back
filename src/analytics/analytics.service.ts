import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AnalyticsQueryDto } from './dto/analytics-query.dto';

import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(organizationId: string, query: AnalyticsQueryDto): Prisma.ExpenseWhereInput {
    return {
      organizationId,
      deletedAt: null,
      categoryId: query.categoryId,
      expenseDate:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };
  }

  async getOverview(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [summary, groupedCategories, expenseCount] = await this.prisma.$transaction([
      this.prisma.expense.aggregate({
        where,
        _sum: { convertedAmount: true },
        _avg: { convertedAmount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { convertedAmount: true },
        orderBy: {
          _sum: { convertedAmount: 'desc' },
        },
        take: 1,
      }),
      this.prisma.expense.count({ where }),
    ]);

    const topCategory =
      groupedCategories[0]?.categoryId
        ? await this.prisma.expenseCategory.findUnique({
            where: { id: groupedCategories[0].categoryId },
          })
        : null;

    return {
      totalExpenses: Number(summary._sum.convertedAmount ?? 0),
      currency: query.currency ?? 'INR',
      monthlyChangePercent: 0,
      topCategory: topCategory?.name ?? null,
      expenseCount,
      averageExpense: Number(summary._avg.convertedAmount ?? 0),
    };
  }

  getMonthlyExpenses(organizationId: string, query: AnalyticsQueryDto) {
    void query;
    return this.prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "expenseDate") AS month,
             SUM("convertedAmount")::float AS total
      FROM "Expense"
      WHERE "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', "expenseDate")
      ORDER BY month ASC
    `;
  }

  getCategoryBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    return this.prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { convertedAmount: true },
      orderBy: { _sum: { convertedAmount: 'desc' } },
    });
  }

  getPaymentMethodBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    return this.prisma.expense.groupBy({
      by: ['paymentMethod'],
      where: this.buildWhere(organizationId, query),
      _sum: { convertedAmount: true },
      _count: { _all: true },
    });
  }

  getVendorBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    return this.prisma.expense.groupBy({
      by: ['vendorName'],
      where: this.buildWhere(organizationId, query),
      _sum: { convertedAmount: true },
      orderBy: { _sum: { convertedAmount: 'desc' } },
      take: 10,
    });
  }

  getCurrencyBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    return this.prisma.expense.groupBy({
      by: ['currency'],
      where: this.buildWhere(organizationId, query),
      _sum: { amount: true, convertedAmount: true },
    });
  }

  getRecurringExpenses(organizationId: string, query: AnalyticsQueryDto) {
    return this.prisma.expense.findMany({
      where: {
        ...this.buildWhere(organizationId, query),
        isRecurring: true,
      },
      orderBy: { expenseDate: 'desc' },
    });
  }
}
