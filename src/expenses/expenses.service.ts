import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpenseStatus, MembershipRole, Prisma } from '@prisma/client';


import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDecisionDto } from './dto/expense-decision.dto';
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

  list(
    organizationId: string,
    actor: { id: string; role: MembershipRole },
    query: ExpenseQueryDto,
  ) {
    return this.expensesRepository.findMany(organizationId, actor, query);
  }

  async getOne(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
  ) {
    const expense = await this.expensesRepository.findOne(organizationId, id);
    this.expensesRepository.assertViewable(expense, actor);
    return expense;
  }

  async getHistory(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
  ) {
    const expense = await this.expensesRepository.findOne(organizationId, id);
    this.expensesRepository.assertViewable(expense, actor);
    return this.auditLogsService.listForEntity('expense', id, organizationId);
  }

  async create(organizationId: string, userId: string, dto: CreateExpenseDto) {
    if (dto.categoryId) {
      await this.categoriesRepository.ensureExists(organizationId, dto.categoryId);
    }

    const organizationMemberships = await this.organizationsRepository.listByUserId(userId);
    const organization = organizationMemberships.find((membership) => membership.organization.id === organizationId)?.organization;
    const baseCurrency = organization?.defaultCurrency ?? dto.currency;
    const rateInfo = await this.currencyService.resolveRate(
      dto.currency,
      baseCurrency,
      new Date(dto.expenseDate),
      organizationId,
    );

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
        approvedAt: dto.status === ExpenseStatus.APPROVED ? new Date() : undefined,
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
    const currentExpense = await this.expensesRepository.assertEditable(organizationId, id, actor);

    if (dto.categoryId) {
      await this.categoriesRepository.ensureExists(organizationId, dto.categoryId);
    }

    let convertedAmount: Prisma.Decimal | undefined;
    let exchangeRate: Prisma.Decimal | undefined;
    let baseCurrency: string | undefined;
    let currencyRateId: string | undefined | null;

    if (dto.currency || dto.amount || dto.expenseDate) {
      const org = await this.organizationsRepository.getByIdForUser(organizationId, actor.id);
      const amount = dto.amount ?? Number(currentExpense.amount);
      const currency = dto.currency ?? currentExpense.currency;
      const rateInfo = await this.currencyService.resolveRate(
        currency,
        org.defaultCurrency,
        new Date(dto.expenseDate ?? currentExpense.expenseDate),
        organizationId,
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
        approvedAt:
          dto.status === ExpenseStatus.APPROVED && currentExpense.status !== ExpenseStatus.APPROVED
            ? new Date()
            : dto.status && dto.status !== ExpenseStatus.APPROVED
              ? null
              : undefined,
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

    if (dto.status && dto.status !== currentExpense.status) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.id,
        action: 'expense.status_changed',
        entityType: 'expense',
        entityId: id,
        metadata: {
          previousStatus: currentExpense.status,
          nextStatus: dto.status,
        },
      });
    }

    return this.expensesRepository.findOne(organizationId, expense.id);
  }

  async approve(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
    dto: ExpenseDecisionDto,
  ) {
    const expense = await this.expensesRepository.assertApprovable(organizationId, id, actor);

    if (expense.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted expenses can be approved');
    }

    const updated = await this.expensesRepository.update(organizationId, id, {
      status: ExpenseStatus.APPROVED,
      approvedAt: new Date(),
    });

    await this.auditLogsService.log({
      organizationId,
      userId: actor.id,
      action: 'expense.approved',
      entityType: 'expense',
      entityId: id,
      metadata: {
        previousStatus: expense.status,
        nextStatus: ExpenseStatus.APPROVED,
        reason: dto.reason ?? null,
      },
    });

    return this.expensesRepository.findOne(organizationId, updated.id);
  }

  async reject(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
    dto: ExpenseDecisionDto,
  ) {
    const expense = await this.expensesRepository.assertApprovable(organizationId, id, actor);

    if (expense.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted expenses can be rejected');
    }

    const updated = await this.expensesRepository.update(organizationId, id, {
      status: ExpenseStatus.REJECTED,
      approvedAt: null,
    });

    await this.auditLogsService.log({
      organizationId,
      userId: actor.id,
      action: 'expense.rejected',
      entityType: 'expense',
      entityId: id,
      metadata: {
        previousStatus: expense.status,
        nextStatus: ExpenseStatus.REJECTED,
        reason: dto.reason ?? null,
      },
    });

    return this.expensesRepository.findOne(organizationId, updated.id);
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
