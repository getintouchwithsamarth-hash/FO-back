import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

import { Public } from '@/common/decorators/public.decorator';


@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  @Public()
  listCurrencies() {
    return this.currencyService.listCurrencies();
  }

  @Get('currency-rates')
  @Public()
  listRates() {
    return this.currencyService.listRates();
  }

  @Post('currency/convert')
  convert(@Body() dto: ConvertCurrencyDto) {
    return this.currencyService.convert(dto);
  }
}
