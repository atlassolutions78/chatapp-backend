import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  verifyStreamSignature(rawBody: string, signature: string): boolean {
    const client = StreamChat.getInstance(
      this.config.getOrThrow('STREAM_API_KEY'),
      this.config.getOrThrow('STREAM_API_SECRET'),
    );
    return client.verifyWebhook(rawBody, signature);
  }

  async handleEvent(event: Record<string, unknown>): Promise<void> {
    switch (event.type) {
      case 'message.new':
        await this.handleMessageNew(event);
        break;
      case 'call.ring':
        await this.handleCallRing(event);
        break;
    }
  }

  private async handleMessageNew(event: Record<string, unknown>): Promise<void> {
    const user = event.user as Record<string, string> | undefined;
    const message = event.message as Record<string, string> | undefined;
    const members = (event.members as Record<string, unknown>[]) ?? [];

    const senderId = user?.id;
    const senderName = user?.name ?? 'Someone';
    const messageText = message?.text ?? 'New message';
    const channelId = event.channel_id as string;

    const recipientIds = members
      .map((m) => (m.user_id ?? (m.user as Record<string, string>)?.id) as string)
      .filter((id) => id && id !== senderId);

    await this.sendPushNotifications(recipientIds, {
      title: senderName,
      body: messageText,
      data: { type: 'message', channelId },
    });
  }

  private async handleCallRing(event: Record<string, unknown>): Promise<void> {
    const call = event.call as Record<string, unknown> | undefined;
    const createdBy = call?.created_by as Record<string, string> | undefined;
    const members = (event.members as Record<string, unknown>[]) ?? [];

    const callerId = createdBy?.id;
    const callerName = createdBy?.name ?? 'Someone';
    const callId = call?.id as string;

    const recipientIds = members
      .map((m) => (m.user_id ?? (m.user as Record<string, string>)?.id) as string)
      .filter((id) => id && id !== callerId);

    await this.sendPushNotifications(recipientIds, {
      title: callerName,
      body: 'Incoming call',
      data: { type: 'call', callId },
    });
  }

  private async sendPushNotifications(
    userIds: string[],
    notification: { title: string; body: string; data: Record<string, string> },
  ): Promise<void> {
    if (!userIds.length) return;

    const records = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (!tokens.length) return;

    const messages = tokens.map((to) => ({
      to,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });
  }
}
