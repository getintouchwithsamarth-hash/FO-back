import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { UpsertOrganizationCurrencyRatesDto } from './dto/upsert-organization-currency-rates.dto';
import { CurrencyRepository } from './repositories/currency.repository';

@Injectable()
export class CurrencyService {
  constructor(private readonly currencyRepository: CurrencyRepository) {}

  listCurrencies() {
    return this.currencyRepository.listSupportedCurrencies();
  }

  listRates() {
    return this.currencyRepository.getLatestRates();
  }

  listOrganizationRates(organizationId: string) {
    return this.currencyRepository.listRatesForOrganization(organizationId);
  }

  async upsertOrganizationRates(organizationId: string, dto: UpsertOrganizationCurrencyRatesDto) {
    const rateDate = dto.rateDate ? new Date(dto.rateDate) : new Date();

    return Promise.all(
      dto.rates
        .filter((rate) => rate.baseCurrency !== rate.targetCurrency)
        .map((rate) =>
          this.currencyRepository.upsertOrganizationRate({
            organizationId,
            baseCurrency: rate.baseCurrency,
            targetCurrency: rate.targetCurrency,
            rate: new Prisma.Decimal(rate.rate),
            provider: 'manual',
            rateDate,
          }),
        ),
    );
  }

  async convert(dto: ConvertCurrencyDto) {
    if (dto.from === dto.to) {
      return { ...dto, rate: 1, convertedAmount: dto.amount };
    }

    const rate = await this.currencyRepository.findRate(dto.from, dto.to);
    if (!rate) {
      throw new BadRequestException(`No exchange rate found for ${dto.from}/${dto.to}`);
    }

    return {
      from: dto.from,
      to: dto.to,
      amount: dto.amount,
      rate: Number(rate.rate),
      convertedAmount: Number(rate.rate) * dto.amount,
    };
  }

  async resolveRate(from: string, to: string, expenseDate: Date, organizationId?: string) {
    if (from === to) {
      return { rate: 1, baseCurrency: to, currencyRateId: null };
    }

    const rate = await this.currencyRepository.findRate(from, to, expenseDate, organizationId);
    if (!rate) {
      throw new BadRequestException(`Exchange rate missing for ${from}/${to}`);
    }

    return {
      rate: Number(rate.rate),
      baseCurrency: to,
      currencyRateId: rate.id,
    };
  }
}
