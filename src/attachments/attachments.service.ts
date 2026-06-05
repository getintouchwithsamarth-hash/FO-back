import { BadRequestException, Injectable } from '@nestjs/common';
import { AttachmentEntityType } from '@prisma/client';
import crypto from 'node:crypto';
import path from 'node:path';

import { CreateAttachmentUploadDto } from './dto/create-attachment-upload.dto';
import { AttachmentsRepository } from './repositories/attachments.repository';

import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { ExpensesRepository } from '@/expenses/repositories/expenses.repository';
import { StorageService } from '@/storage/storage.service';


const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf', 'image/webp'];

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly expensesRepository: ExpensesRepository,
    private readonly storageService: StorageService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createUpload(
    organizationId: string,
    userId: string,
    dto: CreateAttachmentUploadDto,
    maxSize: number,
  ) {
    if (!allowedMimeTypes.includes(dto.fileType)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (dto.fileSize > maxSize) {
      throw new BadRequestException('Attachment exceeds allowed size');
    }

    const extension = path.extname(dto.fileName) || '';
    const storageKey = `${organizationId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
    const attachment = await this.attachmentsRepository.create({
      organizationId,
      uploadedByUserId: userId,
      entityType: dto.entityType ?? AttachmentEntityType.EXPENSE,
      entityId: dto.entityId,
      fileName: dto.fileName,
      fileType: dto.fileType,
      fileSize: dto.fileSize,
      storageKey,
    });

    return {
      attachment,
      uploadUrl: await this.storageService.createUploadUrl(storageKey, dto.fileType),
    };
  }

  async createExpenseAttachmentUpload(
    organizationId: string,
    expenseId: string,
    userId: string,
    dto: Omit<CreateAttachmentUploadDto, 'entityId' | 'entityType'>,
    maxSize: number,
  ) {
    await this.expensesRepository.findOne(organizationId, expenseId);
    return this.createUpload(
      organizationId,
      userId,
      { ...dto, entityId: expenseId, entityType: AttachmentEntityType.EXPENSE },
      maxSize,
    );
  }

  async getOne(organizationId: string, id: string) {
    const attachment = await this.attachmentsRepository.findOne(organizationId, id);
    return {
      ...attachment,
      downloadUrl: await this.storageService.createDownloadUrl(attachment.storageKey),
    };
  }

  async remove(organizationId: string, id: string, userId: string) {
    const deleted = await this.attachmentsRepository.softDelete(organizationId, id);
    await this.auditLogsService.log({
      organizationId,
      userId,
      action: 'attachment.deleted',
      entityType: 'attachment',
      entityId: id,
    });
    return deleted;
  }
}
