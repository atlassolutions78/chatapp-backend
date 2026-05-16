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
var PresenceGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const presence_service_1 = require("./presence.service");
let PresenceGateway = PresenceGateway_1 = class PresenceGateway {
    presenceService;
    jwtService;
    config;
    server;
    logger = new common_1.Logger(PresenceGateway_1.name);
    socketUserMap = new Map();
    constructor(presenceService, jwtService, config) {
        this.presenceService = presenceService;
        this.jwtService = jwtService;
        this.config = config;
    }
    afterInit(server) {
        this.presenceService.setServer(server);
    }
    handleConnection(client, req) {
        try {
            const url = new URL(req.url ?? '', 'http://localhost');
            const token = url.searchParams.get('token');
            if (!token)
                throw new Error('No token');
            const payload = this.jwtService.verify(token, {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
            });
            const userId = payload.sub;
            this.socketUserMap.set(client, userId);
            this.presenceService.handleConnect(client, userId);
            const onlineIds = this.presenceService.getOnlineUserIds();
            client.send(JSON.stringify({ event: 'presence:online_users', data: onlineIds }));
            this.logger.log(`User ${userId} connected`);
        }
        catch {
            client.terminate();
        }
    }
    async handleDisconnect(client) {
        const userId = this.socketUserMap.get(client);
        if (!userId)
            return;
        this.socketUserMap.delete(client);
        await this.presenceService.handleDisconnect(client, userId);
        this.logger.log(`User ${userId} disconnected`);
    }
};
exports.PresenceGateway = PresenceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], PresenceGateway.prototype, "server", void 0);
exports.PresenceGateway = PresenceGateway = PresenceGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ path: '/presence' }),
    __metadata("design:paramtypes", [presence_service_1.PresenceService,
        jwt_1.JwtService,
        config_1.ConfigService])
], PresenceGateway);
//# sourceMappingURL=presence.gateway.js.map