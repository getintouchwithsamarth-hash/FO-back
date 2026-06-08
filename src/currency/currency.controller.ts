import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';

import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { UpsertOrganizationCurrencyRatesDto } from './dto/upsert-organization-currency-rates.dto';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


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

  @Get('organization-currency-rates')
  @UseGuards(OrganizationScopeGuard)
  listOrganizationRates(@CurrentOrganization() organization: { id: string }) {
    return this.currencyService.listOrganizationRates(organization.id);
  }

  @Put('organization-currency-rates')
  @UseGuards(OrganizationScopeGuard)
  @Roles({ membership: ['OWNER', 'ADMIN'] })
  upsertOrganizationRates(
    @CurrentOrganization() organization: { id: string },
    @Body() dto: UpsertOrganizationCurrencyRatesDto,
  ) {
    return this.currencyService.upsertOrganizationRates(organization.id, dto);
  }

  @Post('currency/convert')
  convert(@Body() dto: ConvertCurrencyDto) {
    return this.currencyService.convert(dto);
  }
}
