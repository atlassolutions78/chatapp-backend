import { ConfigService } from '@nestjs/config';
export declare class NotificationsService {
    private config;
    private readonly logger;
    private readonly messaging;
    private readonly streamClient;
    private readonly apiSecret;
    constructor(config: ConfigService);
    verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
    pushMessage(senderId: string, channelId: string, channelType: string, senderName: string, messageText: string, messageId: string): Promise<void>;
}
