import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class PushMessageDto {
  @IsString() channelId!: string;
  @IsString() channelType!: string;
  @IsString() senderName!: string;
  @IsString() messageText!: string;
  @IsString() messageId!: string;
}

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly svc: NotificationsService) {}

  /**
   * POST /api/notifications/push-message
   * Called by the sender's app after sending a chat message.
   * Sends a data-only FCM to all other channel members so they get a
   * background-handler notification even when the app is killed.
   */
  @Post('push-message')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async pushMessage(
    @CurrentUser('id') senderId: string,
    @Body() body: PushMessageDto,
  ) {
    const { channelId, channelType, senderName, messageText, messageId } = body;
    this.svc
      .pushMessage(senderId, channelId, channelType, senderName, messageText, messageId)
      .catch((err) => this.logger.error('pushMessage error:', err));
    return { ok: true };
  }

  /**
   * POST /api/webhooks/stream-chat  (legacy — kept for future webhook use)
   * Stream Chat can POST here for message.new events.
   */
  @Post('webhook/stream-chat')
  @HttpCode(200)
  async streamWebhook(@Req() req: Request) {
    const event = req.body as any;
    if (event?.type === 'message.new' && event.message) {
      const m = event.message;
      this.svc
        .pushMessage(
          m.user?.id ?? '',
          event.channel_id ?? '',
          event.channel_type ?? 'messaging',
          m.user?.name ?? 'Unknown',
          m.text?.slice(0, 100) ?? '',
          m.id ?? '',
        )
        .catch((err) => this.logger.error('webhook pushMessage error:', err));
    }
    return { ok: true };
  }
}
