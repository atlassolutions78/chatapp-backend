import { Injectable } from '@nestjs/common';
import { WebSocket, Server } from 'ws';
import { PrismaService } from '../prisma/prisma.service';

export type PresenceData = {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
};

@Injectable()
export class PresenceService {
  private server!: Server;
  // userId → set of socket instances (supports multiple devices)
  private readonly onlineUsers = new Map<string, Set<WebSocket>>();

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  handleConnect(client: WebSocket, userId: string) {
    const sockets = this.onlineUsers.get(userId) ?? new Set<WebSocket>();
    const wasOffline = sockets.size === 0;
    sockets.add(client);
    this.onlineUsers.set(userId, sockets);

    if (wasOffline) {
      this.broadcast({ userId, isOnline: true, lastSeenAt: null });
    }
  }

  async handleDisconnect(client: WebSocket, userId: string) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(client);

    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      const lastSeenAt = new Date();
      await this.prisma.user.updateMany({
        where: { id: userId },
        data: { lastSeenAt },
      });
      this.broadcast({
        userId,
        isOnline: false,
        lastSeenAt: lastSeenAt.toISOString(),
      });
    }
  }

  async getPresence(userId: string): Promise<PresenceData> {
    const isOnline = this.onlineUsers.has(userId);
    if (isOnline) return { userId, isOnline: true, lastSeenAt: null };

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });
    return {
      userId,
      isOnline: false,
      lastSeenAt: user?.lastSeenAt?.toISOString() ?? null,
    };
  }

  async getBulkPresence(userIds: string[]): Promise<PresenceData[]> {
    const offlineIds = userIds.filter((id) => !this.onlineUsers.has(id));

    const dbUsers = await this.prisma.user.findMany({
      where: { id: { in: offlineIds } },
      select: { id: true, lastSeenAt: true },
    });
    const lastSeenMap = new Map(
      dbUsers.map((u) => [u.id, u.lastSeenAt?.toISOString() ?? null]),
    );

    return userIds.map((userId) => ({
      userId,
      isOnline: this.onlineUsers.has(userId),
      lastSeenAt: this.onlineUsers.has(userId)
        ? null
        : (lastSeenMap.get(userId) ?? null),
    }));
  }

  getOnlineUserIds(): string[] {
    return [...this.onlineUsers.keys()];
  }

  private broadcast(data: PresenceData) {
    const msg = JSON.stringify({ event: 'presence:change', data });
    this.server?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
}
