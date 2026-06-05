import { AttachmentEntityType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAttachmentUploadDto {
  @IsString()
  fileName!: string;

  @IsString()
  fileType!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;

  @IsOptional()
  @IsEnum(AttachmentEntityType)
  entityType?: AttachmentEntityType;

  @IsOptional()
  @IsString()
  entityId?: string;
}
