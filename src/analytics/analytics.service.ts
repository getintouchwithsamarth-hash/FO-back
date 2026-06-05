import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AnalyticsQueryDto } from './dto/analytics-query.dto';

import { CurrencyService } from '@/currency/currency.service';
import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService,
  ) {}

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

  private async getCurrencyContext(organizationId: string, targetCurrency?: string) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { defaultCurrency: true },
    });

    const displayCurrency = targetCurrency ?? organization.defaultCurrency;
    if (displayCurrency === organization.defaultCurrency) {
      return {
        baseCurrency: organization.defaultCurrency,
        displayCurrency,
        factor: 1,
      };
    }

    const rateInfo = await this.currencyService.resolveRate(
      organization.defaultCurrency,
      displayCurrency,
      new Date(),
    );

    return {
      baseCurrency: organization.defaultCurrency,
      displayCurrency,
      factor: rateInfo.rate,
    };
  }

  async getOverview(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [summary, groupedCategories, expenseCount, context] = await Promise.all([
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
      this.getCurrencyContext(organizationId, query.currency),
    ]);

    const topCategory =
      groupedCategories[0]?.categoryId
        ? await this.prisma.expenseCategory.findUnique({
            where: { id: groupedCategories[0].categoryId },
          })
        : null;

    return {
      totalExpenses: Number(summary._sum.convertedAmount ?? 0) * context.factor,
      currency: context.displayCurrency,
      monthlyChangePercent: 0,
      topCategory: topCategory?.name ?? null,
      expenseCount,
      averageExpense: Number(summary._avg.convertedAmount ?? 0) * context.factor,
    };
  }

  async getMonthlyExpenses(organizationId: string, query: AnalyticsQueryDto) {
    const rows = (await this.prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "expenseDate") AS month,
             SUM("convertedAmount")::float AS total
      FROM "Expense"
      WHERE "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', "expenseDate")
      ORDER BY month ASC
    `) as Array<{ month: Date; total: number }>;

    const context = await this.getCurrencyContext(organizationId, query.currency);
    return rows.map((row) => ({
      month: row.month.toLocaleString('en-US', { month: 'short' }),
      amount: row.total * context.factor,
      currency: context.displayCurrency,
    }));
  }

  async getCategoryBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [result, context] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { convertedAmount: true },
        orderBy: { _sum: { convertedAmount: 'desc' } },
      }),
      this.getCurrencyContext(organizationId, query.currency),
    ]);
    const categories = await this.prisma.expenseCategory.findMany({
      where: {
        id: {
          in: result.map((item) => item.categoryId).filter(Boolean) as string[],
        },
      },
    });

    return result.map((item) => ({
      categoryId: item.categoryId,
      category: categories.find((category) => category.id === item.categoryId)?.name ?? 'Other',
      amount: Number(item._sum.convertedAmount ?? 0) * context.factor,
      currency: context.displayCurrency,
    }));
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
