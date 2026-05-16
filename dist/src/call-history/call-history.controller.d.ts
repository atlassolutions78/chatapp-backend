import { CallHistoryService } from './call-history.service';
import { CreateCallHistoryDto } from './dto/create-call-history.dto';
export declare class CallHistoryController {
    private readonly callHistoryService;
    constructor(callHistoryService: CallHistoryService);
    create(userId: string, dto: CreateCallHistoryDto): Promise<{
        participants: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        }[];
        caller: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        };
    } & {
        id: string;
        type: import("@prisma/client").$Enums.CallType;
        channelId: string;
        streamCallId: string;
        participantIds: string[];
        status: import("@prisma/client").$Enums.CallStatus;
        startedAt: Date;
        answeredAt: Date | null;
        endedAt: Date | null;
        durationSeconds: number | null;
        callerId: string;
    }>;
    findAll(userId: string): Promise<{
        direction: string;
        participants: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        }[];
        caller: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        };
        id: string;
        type: import("@prisma/client").$Enums.CallType;
        channelId: string;
        streamCallId: string;
        participantIds: string[];
        status: import("@prisma/client").$Enums.CallStatus;
        startedAt: Date;
        answeredAt: Date | null;
        endedAt: Date | null;
        durationSeconds: number | null;
        callerId: string;
    }[]>;
    markAnswered(id: string, userId: string): Promise<{
        participants: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        }[];
        caller: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        };
    } & {
        id: string;
        type: import("@prisma/client").$Enums.CallType;
        channelId: string;
        streamCallId: string;
        participantIds: string[];
        status: import("@prisma/client").$Enums.CallStatus;
        startedAt: Date;
        answeredAt: Date | null;
        endedAt: Date | null;
        durationSeconds: number | null;
        callerId: string;
    }>;
    finish(id: string): Promise<{
        participants: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        }[];
        caller: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            email: string | null;
        };
    } & {
        id: string;
        type: import("@prisma/client").$Enums.CallType;
        channelId: string;
        streamCallId: string;
        participantIds: string[];
        status: import("@prisma/client").$Enums.CallStatus;
        startedAt: Date;
        answeredAt: Date | null;
        endedAt: Date | null;
        durationSeconds: number | null;
        callerId: string;
    }>;
    delete(id: string): Promise<void>;
}
