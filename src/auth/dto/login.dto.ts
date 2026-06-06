import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
