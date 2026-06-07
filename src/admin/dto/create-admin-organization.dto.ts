import { IsString } from 'class-validator';

export class CreateAdminOrganizationDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  defaultCurrency!: string;
}
