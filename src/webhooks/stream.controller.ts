import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBody,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { StreamChat } from 'stream-chat';
import { PushService } from '../push/push.service';
import { PrismaService } from '../prisma/prisma.service';

interface StreamMessageNewEvent {
  type: string;
  message?: {
    id: string;
    text?: string;
    user?: { id: string; name?: string };
  };
  channel_id?: string;
  members?: { user_id: string }[];
}

@ApiExcludeController()
@Controller('webhooks')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(
    private readonly push: PushService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('stream-chat')
  @HttpCode(200)
  async handleStreamEvent(
    @RawBody() rawBody: Buffer,
    @Headers('x-signature') signature: string,
    @Body() body: StreamMessageNewEvent,
  ) {
    // Verify signature if a webhook secret is configured
    const webhookSecret = this.config.get<string>('STREAM_WEBHOOK_SECRET');
    if (webhookSecret) {
      const client = StreamChat.getInstance(
        this.config.getOrThrow('STREAM_API_KEY'),
        this.config.getOrThrow('STREAM_API_SECRET'),
      );
      const isValid = client.verifyWebhook(
        rawBody.toString('utf8'),
        signature ?? '',
      );
      if (!isValid) {
        this.logger.warn('Stream webhook: invalid signature — ignored');
        return { ok: false };
      }
    }

    if (body.type !== 'message.new') return { ok: true };

    const senderId = body.message?.user?.id;
    const senderName = body.message?.user?.name ?? 'Someone';
    const rawText = body.message?.text ?? '';
    const preview =
      rawText.length > 50 ? rawText.slice(0, 47) + '…' : rawText || '📎 Attachment';

    if (!senderId || !body.channel_id) return { ok: true };

    // Recipient user IDs = all channel members except the sender
    const recipientIds = (body.members ?? [])
      .map((m) => m.user_id)
      .filter((id) => id !== senderId);

    if (recipientIds.length === 0) return { ok: true };

    void this.push.sendToUsers(recipientIds, {
      title: senderName,
      body: preview,
      sound: 'default',
      data: {
        type: 'message',
        chatId: body.channel_id,
        senderId,
      },
    });

    return { ok: true };
  }
}
