"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
const prisma_service_1 = require("../prisma/prisma.service");
let PresenceService = class PresenceService {
    prisma;
    server;
    onlineUsers = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    setServer(server) {
        this.server = server;
    }
    handleConnect(client, userId) {
        const sockets = this.onlineUsers.get(userId) ?? new Set();
        const wasOffline = sockets.size === 0;
        sockets.add(client);
        this.onlineUsers.set(userId, sockets);
        if (wasOffline) {
            this.broadcast({ userId, isOnline: true, lastSeenAt: null });
        }
    }
    async handleDisconnect(client, userId) {
        const sockets = this.onlineUsers.get(userId);
        if (!sockets)
            return;
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
    async getPresence(userId) {
        const isOnline = this.onlineUsers.has(userId);
        if (isOnline)
            return { userId, isOnline: true, lastSeenAt: null };
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
    async getBulkPresence(userIds) {
        const offlineIds = userIds.filter((id) => !this.onlineUsers.has(id));
        const dbUsers = await this.prisma.user.findMany({
            where: { id: { in: offlineIds } },
            select: { id: true, lastSeenAt: true },
        });
        const lastSeenMap = new Map(dbUsers.map((u) => [u.id, u.lastSeenAt?.toISOString() ?? null]));
        return userIds.map((userId) => ({
            userId,
            isOnline: this.onlineUsers.has(userId),
            lastSeenAt: this.onlineUsers.has(userId)
                ? null
                : (lastSeenMap.get(userId) ?? null),
        }));
    }
    getOnlineUserIds() {
        return [...this.onlineUsers.keys()];
    }
    broadcast(data) {
        const msg = JSON.stringify({ event: 'presence:change', data });
        this.server?.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(msg);
            }
        });
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PresenceService);
//# sourceMappingURL=presence.service.js.map