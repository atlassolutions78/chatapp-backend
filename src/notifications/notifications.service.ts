import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { StreamChat } from 'stream-chat';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging: admin.messaging.Messaging | null = null;
  private readonly streamClient: StreamChat;
  private readonly apiSecret: string;

  constructor(private config: ConfigService) {
    const apiKey = config.getOrThrow<string>('STREAM_API_KEY');
    this.apiSecret = config.getOrThrow<string>('STREAM_API_SECRET');
    this.streamClient = StreamChat.getInstance(apiKey, this.apiSecret);
  }

  onModuleInit() {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.config.get('FIREBASE_PROJECT_ID'),
            privateKey: this.config
              .get<string>('FIREBASE_PRIVATE_KEY')
              ?.replace(/\\n/g, '\n'),
            clientEmail: this.config.get('FIREBASE_CLIENT_EMAIL'),
          }),
        });
      }
      this.messaging = admin.messaging();
    } catch (err) {
      this.logger.warn(`Firebase init failed, push notifications disabled: ${err}`);
    }
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const hmac = crypto
      .createHmac('sha256', this.apiSecret)
      .update(rawBody)
      .digest('hex');
    return hmac === signature;
  }

  /**
   * Push a message notification to all channel members except the sender.
   * Called from the app (sender side) after a message is sent, so offline
   * recipients always receive a data-only FCM even if Stream's built-in push
   * fails or is delayed.
   */
  async pushMessage(
    senderId: string,
    channelId: string,
    channelType: string,
    senderName: string,
    messageText: string,
    messageId: string,
  ): Promise<void> {
    // Get channel members excluding the sender
    let memberIds: string[] = [];
    try {
      const channel = this.streamClient.channel(channelType, channelId);
      const state = await channel.query({ state: true });
      memberIds = (state.members ?? [])
        .map((m: any) => (m.user_id ?? m.user?.id) as string)
        .filter((id) => id && id !== senderId);
    } catch (err) {
      this.logger.warn(`Failed to query channel ${channelId}: ${err}`);
      return;
    }

    if (!memberIds.length) return;

    // Fetch FCM tokens from Stream for each recipient
    const deviceResults = await Promise.allSettled(
      memberIds.map((uid) =>
        this.streamClient.getDevices(uid).catch(() => ({ devices: [] })),
      ),
    );

    const fcmTokens: string[] = [];
    deviceResults.forEach((r) => {
      if (r.status === 'fulfilled') {
        ((r.value as any).devices ?? []).forEach((d: any) => {
          if (d.push_provider === 'firebase' && d.id) fcmTokens.push(d.id);
        });
      }
    });

    if (!fcmTokens.length || !this.messaging) {
      this.logger.debug(`No FCM tokens found for recipients of ${channelId}`);
      return;
    }

    // Send data-only HIGH-priority FCM — background handler shows notification
    const messaging = this.messaging;
    await Promise.allSettled(
      fcmTokens.map((token) =>
        messaging
          .send({
            token,
            data: {
              sender: 'stream.chat',
              channel_id: channelId,
              channel_type: channelType,
              message_id: messageId,
              sender_name: senderName,
              message_text: messageText,
            },
            android: { priority: 'high' },
          })
          .catch((err) =>
            this.logger.warn(
              `FCM failed for token ${token.slice(0, 20)}: ${err.message}`,
            ),
          ),
      ),
    );

    this.logger.log(
      `Pushed FCM to ${fcmTokens.length} device(s) for channel ${channelId}`,
    );
  }
}
