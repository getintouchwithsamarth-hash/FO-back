import { ExpenseStatus, PaymentMethod } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ExpenseQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
