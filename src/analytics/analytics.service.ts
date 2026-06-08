import { Injectable } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';

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

  private async getDisplayCurrency(organizationId: string, targetCurrency?: string) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { defaultCurrency: true },
    });

    return targetCurrency ?? organization.defaultCurrency;
  }

  private getRateFactor(
    rates: Array<{
      organizationId?: string | null;
      baseCurrency: string;
      targetCurrency: string;
      rate: Prisma.Decimal;
      rateDate: Date;
    }>,
    fromCurrency: string,
    toCurrency: string,
    effectiveAt?: Date | null,
  ) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const direct = rates.find(
      (rate) =>
        rate.baseCurrency === fromCurrency &&
        rate.targetCurrency === toCurrency &&
        (!effectiveAt || rate.rateDate <= effectiveAt),
    );

    if (direct) {
      return Number(direct.rate);
    }

    const inverse = rates.find(
      (rate) =>
        rate.baseCurrency === toCurrency &&
        rate.targetCurrency === fromCurrency &&
        (!effectiveAt || rate.rateDate <= effectiveAt),
    );

    if (inverse) {
      return 1 / Number(inverse.rate);
    }

    return 1;
  }

  private convertExpenseForDisplay(
    expense: {
      baseCurrency: string;
      convertedAmount: Prisma.Decimal;
      status: ExpenseStatus;
      approvedAt: Date | null;
      expenseDate: Date;
    },
    displayCurrency: string,
    rates: Array<{
      organizationId?: string | null;
      baseCurrency: string;
      targetCurrency: string;
      rate: Prisma.Decimal;
      rateDate: Date;
    }>,
  ) {
    const effectiveAt =
      expense.status === ExpenseStatus.APPROVED ? expense.approvedAt ?? expense.expenseDate : undefined;
    const factor = this.getRateFactor(rates, expense.baseCurrency, displayCurrency, effectiveAt);
    return Number(expense.convertedAmount) * factor;
  }

  async getOverview(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [expenses, categories, rates, displayCurrency] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        select: {
          id: true,
          categoryId: true,
          convertedAmount: true,
          baseCurrency: true,
          status: true,
          approvedAt: true,
          expenseDate: true,
        },
      }),
      this.prisma.expenseCategory.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, name: true },
      }),
      this.currencyService.listOrganizationRates(organizationId),
      this.getDisplayCurrency(organizationId, query.currency),
    ]);

    const categoryTotals = new Map<string, number>();
    let totalExpenses = 0;

    for (const expense of expenses) {
      const amount = this.convertExpenseForDisplay(expense, displayCurrency, rates);
      totalExpenses += amount;

      if (expense.categoryId) {
        categoryTotals.set(expense.categoryId, (categoryTotals.get(expense.categoryId) ?? 0) + amount);
      }
    }

    const topCategoryEntry = [...categoryTotals.entries()].sort((left, right) => right[1] - left[1])[0];
    const topCategory = topCategoryEntry
      ? categories.find((category) => category.id === topCategoryEntry[0])?.name ?? null
      : null;

    return {
      totalExpenses,
      currency: displayCurrency,
      monthlyChangePercent: 0,
      topCategory,
      expenseCount: expenses.length,
      averageExpense: expenses.length ? totalExpenses / expenses.length : 0,
    };
  }

  async getMonthlyExpenses(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [expenses, rates, displayCurrency] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        select: {
          expenseDate: true,
          convertedAmount: true,
          baseCurrency: true,
          status: true,
          approvedAt: true,
        },
        orderBy: { expenseDate: 'asc' },
      }),
      this.currencyService.listOrganizationRates(organizationId),
      this.getDisplayCurrency(organizationId, query.currency),
    ]);

    const monthlyTotals = new Map<string, number>();

    for (const expense of expenses) {
      const monthKey = `${expense.expenseDate.getFullYear()}-${String(expense.expenseDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = this.convertExpenseForDisplay(expense, displayCurrency, rates);
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + amount);
    }

    return [...monthlyTotals.entries()].map(([monthKey, amount]) => ({
      month: new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleString('en-US', { month: 'short' }),
      amount,
      currency: displayCurrency,
    }));
  }

  async getCategoryBreakdown(organizationId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(organizationId, query);
    const [expenses, categories, rates, displayCurrency] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        select: {
          categoryId: true,
          convertedAmount: true,
          baseCurrency: true,
          status: true,
          approvedAt: true,
          expenseDate: true,
        },
      }),
      this.prisma.expenseCategory.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, name: true },
      }),
      this.currencyService.listOrganizationRates(organizationId),
      this.getDisplayCurrency(organizationId, query.currency),
    ]);

    const categoryTotals = new Map<string | null, number>();

    for (const expense of expenses) {
      const amount = this.convertExpenseForDisplay(expense, displayCurrency, rates);
      categoryTotals.set(expense.categoryId, (categoryTotals.get(expense.categoryId) ?? 0) + amount);
    }

    return [...categoryTotals.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([categoryId, amount]) => ({
        categoryId,
        category: categories.find((category) => category.id === categoryId)?.name ?? 'Other',
        amount,
        currency: displayCurrency,
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
