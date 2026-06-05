import { Module } from '@nestjs/common';


import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';

import { AuditLogsModule } from '@/audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}
