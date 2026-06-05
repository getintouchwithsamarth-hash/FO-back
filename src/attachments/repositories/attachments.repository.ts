import { Injectable, NotFoundException } from '@nestjs/common';
import { AttachmentEntityType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    organizationId: string;
    uploadedByUserId: string;
    entityType: AttachmentEntityType;
    entityId?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storageKey: string;
  }) {
    return this.prisma.attachment.create({ data });
  }

  async findOne(organizationId: string, id: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  softDelete(organizationId: string, id: string) {
    return this.prisma.attachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
