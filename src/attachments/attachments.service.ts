import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AttachmentEntityType, MembershipRole } from '@prisma/client';
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
    role: MembershipRole,
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
    role: MembershipRole,
    dto: Omit<CreateAttachmentUploadDto, 'entityId' | 'entityType'>,
    maxSize: number,
  ) {
    await this.expensesRepository.assertEditable(organizationId, expenseId, { id: userId, role });
    return this.createUpload(
      organizationId,
      userId,
      role,
      { ...dto, entityId: expenseId, entityType: AttachmentEntityType.EXPENSE },
      maxSize,
    );
  }

  async getOne(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
  ) {
    const attachment = await this.attachmentsRepository.findOne(organizationId, id);
    this.assertAccessible(attachment, actor);
    return {
      ...attachment,
      downloadUrl: await this.storageService.createDownloadUrl(attachment.storageKey),
    };
  }

  async remove(
    organizationId: string,
    id: string,
    actor: { id: string; role: MembershipRole },
  ) {
    const attachment = await this.attachmentsRepository.findOne(organizationId, id);
    this.assertAccessible(attachment, actor);
    const deleted = await this.attachmentsRepository.softDelete(organizationId, id);
    await this.auditLogsService.log({
      organizationId,
      userId: actor.id,
      action: 'attachment.deleted',
      entityType: 'attachment',
      entityId: id,
    });
    return deleted;
  }

  private assertAccessible(
    attachment: { uploadedByUserId: string },
    actor: { id: string; role: MembershipRole },
  ) {
    if (actor.role === MembershipRole.OWNER || actor.role === MembershipRole.ADMIN) {
      return;
    }

    if (attachment.uploadedByUserId !== actor.id) {
      throw new ForbiddenException('You cannot access this attachment');
    }
  }
}
