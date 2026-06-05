import { ExpenseStatus, PaymentMethod, RecurringFrequency } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsDateString()
  expenseDate!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}
