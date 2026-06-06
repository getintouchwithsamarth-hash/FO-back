import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

export class UpdateMemberCredentialsDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_obj, value) => value !== null && typeof value !== 'undefined')
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;
}
