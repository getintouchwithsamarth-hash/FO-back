import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';

class OrganizationCurrencyRateEntryDto {
  @IsIn(['INR', 'USD', 'EUR'])
  baseCurrency!: string;

  @IsIn(['INR', 'USD', 'EUR'])
  targetCurrency!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  rate!: number;
}

export class UpsertOrganizationCurrencyRatesDto {
  @IsOptional()
  @IsDateString()
  rateDate?: string;

  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => OrganizationCurrencyRateEntryDto)
  rates!: OrganizationCurrencyRateEntryDto[];
}
