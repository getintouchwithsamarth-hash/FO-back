import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AttachmentsService } from './attachments.service';
import { CreateAttachmentUploadDto } from './dto/create-attachment-upload.dto';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationScopeGuard } from '@/common/guards/organization-scope.guard';


@Controller()
@UseGuards(OrganizationScopeGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('attachments/upload')
  createUpload(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAttachmentUploadDto,
  ) {
    return this.attachmentsService.createUpload(
      organization.id,
      user.id,
      dto,
      this.configService.getOrThrow<number>('storage.maxAttachmentSizeBytes'),
    );
  }

  @Get('attachments/:id')
  getOne(@CurrentOrganization() organization: { id: string }, @Param('id') id: string) {
    return this.attachmentsService.getOne(organization.id, id);
  }

  @Delete('attachments/:id')
  remove(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.attachmentsService.remove(organization.id, id, user.id);
  }

  @Post('expenses/:id/attachments')
  createExpenseUpload(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Param('id') expenseId: string,
    @Body() dto: CreateAttachmentUploadDto,
  ) {
    return this.attachmentsService.createExpenseAttachmentUpload(
      organization.id,
      expenseId,
      user.id,
      dto,
      this.configService.getOrThrow<number>('storage.maxAttachmentSizeBytes'),
    );
  }

  @Delete('expenses/:id/attachments/:attachmentId')
  removeExpenseAttachment(
    @CurrentOrganization() organization: { id: string },
    @CurrentUser() user: { id: string },
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachmentsService.remove(organization.id, attachmentId, user.id);
  }
}
