import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { IncomingMessage } from 'node:http';
import { Server, WebSocket } from 'ws';
import { PresenceService } from './presence.service';

@WebSocketGateway({ path: '/presence' })
export class PresenceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(PresenceGateway.name);
  private readonly socketUserMap = new Map<WebSocket, string>();

  constructor(
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.presenceService.setServer(server);
  }

  handleConnection(client: WebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url ?? '', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub;
      this.socketUserMap.set(client, userId);
      this.presenceService.handleConnect(client, userId);

      const onlineIds = this.presenceService.getOnlineUserIds();
      client.send(
        JSON.stringify({ event: 'presence:online_users', data: onlineIds }),
      );

      this.logger.log(`User ${userId} connected`);
    } catch {
      client.terminate();
    }
  }

  async handleDisconnect(client: WebSocket) {
    const userId = this.socketUserMap.get(client);
    if (!userId) return;
    this.socketUserMap.delete(client);
    await this.presenceService.handleDisconnect(client, userId);
    this.logger.log(`User ${userId} disconnected`);
  }
}
