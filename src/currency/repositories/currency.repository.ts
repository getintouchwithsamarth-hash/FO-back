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
      where: {
        organizationId: null,
      },
      orderBy: [{ rateDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async listRatesForOrganization(organizationId: string) {
    const rates = await this.prisma.currencyRate.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null }],
      },
      orderBy: [{ rateDate: 'desc' }, { createdAt: 'desc' }],
    });

    return rates.sort((left, right) => {
      const leftPriority = left.organizationId === organizationId ? 0 : 1;
      const rightPriority = right.organizationId === organizationId ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.rateDate.getTime() - left.rateDate.getTime();
    });
  }

  async findRate(
    baseCurrency: string,
    targetCurrency: string,
    rateDate?: Date,
    organizationId?: string,
  ) {
    if (organizationId) {
      const organizationRate = await this.prisma.currencyRate.findFirst({
        where: {
          organizationId,
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

      if (organizationRate) {
        return organizationRate;
      }
    }

    return this.prisma.currencyRate.findFirst({
      where: {
        organizationId: null,
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

  async upsertOrganizationRate(data: {
    organizationId: string;
    baseCurrency: string;
    targetCurrency: string;
    rate: Prisma.Decimal | number | string;
    provider: string;
    rateDate: Date;
  }) {
    const existing = await this.prisma.currencyRate.findFirst({
      where: {
        organizationId: data.organizationId,
        baseCurrency: data.baseCurrency,
        targetCurrency: data.targetCurrency,
        rateDate: data.rateDate,
      },
    });

    if (existing) {
      return this.prisma.currencyRate.update({
        where: { id: existing.id },
        data: {
          rate: data.rate,
          provider: data.provider,
        },
      });
    }

    return this.prisma.currencyRate.create({
      data,
    });
  }

  createRate(data: {
    organizationId?: string | null;
    baseCurrency: string;
    targetCurrency: string;
    rate: Prisma.Decimal | number | string;
    provider: string;
    rateDate: Date;
  }) {
    return this.prisma.currencyRate.create({ data });
  }
}
