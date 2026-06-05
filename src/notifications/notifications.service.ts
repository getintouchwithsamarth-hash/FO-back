import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  notifyUser(userId: string, event: string, payload: Record<string, unknown>) {
    this.logger.log(`Notify ${userId} for ${event}: ${JSON.stringify(payload)}`);
    return { queued: true };
  }
}
