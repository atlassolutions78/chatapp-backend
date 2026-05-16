import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { IncomingMessage } from 'node:http';
import { Server, WebSocket } from 'ws';
import { PresenceService } from './presence.service';
export declare class PresenceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly presenceService;
    private readonly jwtService;
    private readonly config;
    server: Server;
    private readonly logger;
    private readonly socketUserMap;
    constructor(presenceService: PresenceService, jwtService: JwtService, config: ConfigService);
    afterInit(server: Server): void;
    handleConnection(client: WebSocket, req: IncomingMessage): void;
    handleDisconnect(client: WebSocket): Promise<void>;
}
