import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
declare class PushMessageDto {
    channelId: string;
    channelType: string;
    senderName: string;
    messageText: string;
    messageId: string;
}
export declare class NotificationsController {
    private readonly svc;
    private readonly logger;
    constructor(svc: NotificationsService);
    pushMessage(senderId: string, body: PushMessageDto): Promise<{
        ok: boolean;
    }>;
    streamWebhook(req: Request): Promise<{
        ok: boolean;
    }>;
}
export {};
