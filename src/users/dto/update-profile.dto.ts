import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(['INR', 'USD', 'EUR'])
  preferredCurrency?: string;

  @IsOptional()
  @IsIn(['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy'])
  dateFormat?: string;

  @IsOptional()
  @IsIn(['en-IN', 'en-US'])
  numberFormat?: string;
}
