import { IsDateString, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from './pagination-query.dto';

export class DateRangeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
