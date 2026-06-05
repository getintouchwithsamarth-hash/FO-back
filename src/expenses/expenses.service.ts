import { Injectable } from '@nestjs/common';
import { ExpenseStatus, MembershipRole, Prisma } from '@prisma/client';


import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesRepository } from './repositories/expenses.repository';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { CategoriesRepository } from '@/categories/repositories/categories.repository';
import { CurrencyService } from '@/currency/currency.service';
import { OrganizationsRepository } from '@/organizations/repositories/organizations.repository';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly currencyService: CurrencyService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  list(organizationId: string, query: ExpenseQueryDto) {
    return this.expensesRepository.findMany(organizationId, query);
  }

  getOne(organizationId: string, id: string) {
    return this.expensesRepository.findOne(organizationId, id);
  }

  async create(organizationId: string, userId: string, dto: CreateExpenseDto) {
    if (dto.categoryId) {
      await this.categoriesRepository.ensureExists(organizationId, dto.categoryId);
    }

    const organizationMemberships = await this.organizationsRepository.listByUserId(userId);
    const organization = organizationMemberships.find((membership) => membership.organization.id === organizationId)?.organization;
    const baseCurrency = organization?.defaultCurrency ?? dto.currency;
    const rateInfo = await this.currencyService.resolveRate(dto.currency, baseCurrency, new Date(dto.expenseDate));

    const expense = await this.expensesRepository.create(
      organizationId,
      userId,
      {
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        vendorName: dto.vendorName,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        convertedAmount: new Prisma.Decimal(dto.amount * rateInfo.rate),
        baseCurrency: rateInfo.baseCurrency,
        exchangeRate: new Prisma.Decimal(rateInfo.rate),
        currencyRateId: rateInfo.currencyRateId ?? undefined,
        expenseDate: new Date(dto.expenseDate),
        paymentMethod: dto.paymentMethod,
        isRecurring: dto.isRecurring ?? false,
        recurringFrequency: dto.recurringFrequency,
        status: dto.status ?? ExpenseStatus.DRAFT,
        notes: dto.notes,
      } as Prisma.ExpenseUncheckedCreateInput,
      dto.tagNames,
    );

    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'expense.created',
      entityType: 'expense',
      entityId: expense.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return this.expensesRepository.findOne(organizationId, expense.id);
  }

  async update(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
    dto: UpdateExpenseDto,
  ) {
    await this.expensesRepository.assertEditable(organizationId, id, actor);

    if (dto.categoryId) {
      await this.categoriesRepository.ensureExists(organizationId, dto.categoryId);
    }

    let convertedAmount: Prisma.Decimal | undefined;
    let exchangeRate: Prisma.Decimal | undefined;
    let baseCurrency: string | undefined;
    let currencyRateId: string | undefined | null;

    if (dto.currency || dto.amount || dto.expenseDate) {
      const currentExpense = await this.expensesRepository.findOne(organizationId, id);
      const org = await this.organizationsRepository.getByIdForUser(organizationId, actor.id);
      const amount = dto.amount ?? Number(currentExpense.amount);
      const currency = dto.currency ?? currentExpense.currency;
      const rateInfo = await this.currencyService.resolveRate(
        currency,
        org.defaultCurrency,
        new Date(dto.expenseDate ?? currentExpense.expenseDate),
      );

      convertedAmount = new Prisma.Decimal(amount * rateInfo.rate);
      exchangeRate = new Prisma.Decimal(rateInfo.rate);
      baseCurrency = rateInfo.baseCurrency;
      currencyRateId = rateInfo.currencyRateId;
    }

    const expense = await this.expensesRepository.update(
      organizationId,
      id,
      {
        title: dto.title,
        description: dto.description,
        vendorName: dto.vendorName,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        currency: dto.currency,
        categoryId: dto.categoryId,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        paymentMethod: dto.paymentMethod,
        isRecurring: dto.isRecurring,
        recurringFrequency: dto.recurringFrequency,
        status: dto.status,
        notes: dto.notes,
        convertedAmount,
        exchangeRate,
        baseCurrency,
        currencyRateId: currencyRateId ?? undefined,
      },
      dto.tagNames,
    );

    await this.auditLogsService.log({
      organizationId,
      userId: actor.id,
      action: 'expense.updated',
      entityType: 'expense',
      entityId: id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return expense;
  }

  async remove(organizationId: string, id: string, actor: { id: string; role: MembershipRole }) {
    await this.expensesRepository.assertEditable(organizationId, id, actor);
    const expense = await this.expensesRepository.softDelete(organizationId, id);
    await this.auditLogsService.log({
      organizationId,
      userId: actor.id,
      action: 'expense.deleted',
      entityType: 'expense',
      entityId: id,
    });
    return expense;
  }
}
