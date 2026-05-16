"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const stream_chat_1 = require("stream-chat");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    config;
    logger = new common_1.Logger(NotificationsService_1.name);
    messaging;
    streamClient;
    apiSecret;
    constructor(config) {
        this.config = config;
        const apiKey = config.getOrThrow('STREAM_API_KEY');
        this.apiSecret = config.getOrThrow('STREAM_API_SECRET');
        this.streamClient = stream_chat_1.StreamChat.getInstance(apiKey, this.apiSecret);
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: config.get('FIREBASE_PROJECT_ID'),
                    privateKey: config
                        .get('FIREBASE_PRIVATE_KEY')
                        ?.replace(/\\n/g, '\n'),
                    clientEmail: config.get('FIREBASE_CLIENT_EMAIL'),
                }),
            });
        }
        this.messaging = admin.messaging();
    }
    verifyWebhookSignature(rawBody, signature) {
        const hmac = crypto
            .createHmac('sha256', this.apiSecret)
            .update(rawBody)
            .digest('hex');
        return hmac === signature;
    }
    async pushMessage(senderId, channelId, channelType, senderName, messageText, messageId) {
        let memberIds = [];
        try {
            const channel = this.streamClient.channel(channelType, channelId);
            const state = await channel.query({ state: true });
            memberIds = (state.members ?? [])
                .map((m) => (m.user_id ?? m.user?.id))
                .filter((id) => id && id !== senderId);
        }
        catch (err) {
            this.logger.warn(`Failed to query channel ${channelId}: ${err}`);
            return;
        }
        if (!memberIds.length)
            return;
        const deviceResults = await Promise.allSettled(memberIds.map((uid) => this.streamClient.getDevices(uid).catch(() => ({ devices: [] }))));
        const fcmTokens = [];
        deviceResults.forEach((r) => {
            if (r.status === 'fulfilled') {
                (r.value.devices ?? []).forEach((d) => {
                    if (d.push_provider === 'firebase' && d.id)
                        fcmTokens.push(d.id);
                });
            }
        });
        if (!fcmTokens.length) {
            this.logger.debug(`No FCM tokens found for recipients of ${channelId}`);
            return;
        }
        await Promise.allSettled(fcmTokens.map((token) => this.messaging
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
            .catch((err) => this.logger.warn(`FCM failed for token ${token.slice(0, 20)}: ${err.message}`))));
        this.logger.log(`Pushed FCM to ${fcmTokens.length} device(s) for channel ${channelId}`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map