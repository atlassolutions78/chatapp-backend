import { WebSocket, Server } from 'ws';
import { PrismaService } from '../prisma/prisma.service';
export type PresenceData = {
    userId: string;
    isOnline: boolean;
    lastSeenAt: string | null;
};
export declare class PresenceService {
    private readonly prisma;
    private server;
    private readonly onlineUsers;
    constructor(prisma: PrismaService);
    setServer(server: Server): void;
    handleConnect(client: WebSocket, userId: string): void;
    handleDisconnect(client: WebSocket, userId: string): Promise<void>;
    getPresence(userId: string): Promise<PresenceData>;
    getBulkPresence(userIds: string[]): Promise<PresenceData[]>;
    getOnlineUserIds(): string[];
    private broadcast;
}
