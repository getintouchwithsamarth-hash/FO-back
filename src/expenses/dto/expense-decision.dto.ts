import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ExpenseDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
