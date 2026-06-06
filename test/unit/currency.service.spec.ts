import { BadRequestException } from '@nestjs/common';

import { CurrencyService } from '@/currency/currency.service';

describe('CurrencyService', () => {
  it('returns a no-op conversion when currencies match', async () => {
    const repository = {
      listSupportedCurrencies: jest.fn(),
      getLatestRates: jest.fn(),
      findRate: jest.fn(),
    };
    const service = new CurrencyService(repository as never);

    await expect(
      service.convert({
        from: 'INR',
        to: 'INR',
        amount: 1250,
      }),
    ).resolves.toEqual({
      from: 'INR',
      to: 'INR',
      amount: 1250,
      rate: 1,
      convertedAmount: 1250,
    });
    expect(repository.findRate).not.toHaveBeenCalled();
  });

  it('throws when a requested exchange rate is missing', async () => {
    const service = new CurrencyService({
      listSupportedCurrencies: jest.fn(),
      getLatestRates: jest.fn(),
      findRate: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      service.convert({
        from: 'USD',
        to: 'INR',
        amount: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
