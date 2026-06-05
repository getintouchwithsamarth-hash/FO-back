import { Module } from '@nestjs/common';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesRepository } from './repositories/expenses.repository';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { CategoriesModule } from '@/categories/categories.module';
import { CurrencyModule } from '@/currency/currency.module';
import { OrganizationsModule } from '@/organizations/organizations.module';


@Module({
  imports: [AuditLogsModule, CategoriesModule, CurrencyModule, OrganizationsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  exports: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
