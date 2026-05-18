import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class NotificationsService implements OnModuleInit {
    private config;
    private readonly logger;
    private messaging;
    private readonly streamClient;
    private readonly apiSecret;
    constructor(config: ConfigService);
    onModuleInit(): void;
    verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
    pushMessage(senderId: string, channelId: string, channelType: string, senderName: string, messageText: string, messageId: string): Promise<void>;
}
