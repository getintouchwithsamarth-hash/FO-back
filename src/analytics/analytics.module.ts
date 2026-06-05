import { Module } from '@nestjs/common';


import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { CurrencyModule } from '@/currency/currency.module';

@Module({
  imports: [CurrencyModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
