import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform?: string) {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Rejected non-Expo push token for ${userId}: ${token}`);
      return;
    }
    await this.prisma.pushToken.upsert({
      where: { userId_token: { userId, token } },
      update: { platform },
      create: { userId, token, platform },
    });
  }

  async removeToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  async sendToUsers(
    userIds: string[],
    notification: Omit<ExpoPushMessage, 'to'>,
  ) {
    if (userIds.length === 0) return;

    const rows = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    const messages: ExpoPushMessage[] = rows
      .filter((r) => Expo.isExpoPushToken(r.token))
      .map((r) => ({ to: r.token, ...notification }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, i) => {
          if (ticket.status === 'error') {
            this.logger.error(
              `Push ticket error for ${chunk[i]?.to}: ${ticket.message}`,
            );
            // Remove stale device token so we don't keep sending to it
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.details?.error === 'InvalidCredentials'
            ) {
              const staleToken = chunk[i]?.to;
              if (typeof staleToken === 'string') {
                void this.prisma.pushToken.deleteMany({
                  where: { token: staleToken },
                });
              }
            }
          }
        });
      } catch (err) {
        this.logger.error('Push chunk send failed', err);
      }
    }
  }
}
