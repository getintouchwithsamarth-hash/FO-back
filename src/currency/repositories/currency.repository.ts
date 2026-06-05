import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CurrencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  listSupportedCurrencies() {
    return ['USD', 'EUR', 'INR'];
  }

  getLatestRates() {
    return this.prisma.currencyRate.findMany({
      orderBy: [{ rateDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async findRate(baseCurrency: string, targetCurrency: string, rateDate?: Date) {
    return this.prisma.currencyRate.findFirst({
      where: {
        baseCurrency,
        targetCurrency,
        rateDate: rateDate
          ? {
              lte: rateDate,
            }
          : undefined,
      },
      orderBy: [{ rateDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  createRate(data: {
    baseCurrency: string;
    targetCurrency: string;
    rate: Prisma.Decimal | number | string;
    provider: string;
    rateDate: Date;
  }) {
    return this.prisma.currencyRate.create({ data });
  }
}
