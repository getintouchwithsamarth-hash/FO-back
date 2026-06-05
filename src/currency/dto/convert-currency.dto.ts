import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;
}
