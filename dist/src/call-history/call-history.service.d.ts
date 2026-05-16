import { PrismaService } from '../prisma/prisma.service';
import { CreateCallHistoryDto } from './dto/create-call-history.dto';
export declare class CallHistoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(callerId: string, dto: CreateCallHistoryDto): Promise<{
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
    findAllForUser(userId: string): Promise<{
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
    deleteEntry(id: string): Promise<void>;
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
}
