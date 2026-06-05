import { Module } from '@nestjs/common';

import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencyRepository } from './repositories/currency.repository';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService, CurrencyRepository],
  exports: [CurrencyService, CurrencyRepository],
})
export class CurrencyModule {}
