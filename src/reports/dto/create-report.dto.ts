import { ReportType } from '@prisma/client';
import { IsEnum, IsObject } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportType)
  reportType!: ReportType;

  @IsObject()
  filters!: Record<string, unknown>;
}
