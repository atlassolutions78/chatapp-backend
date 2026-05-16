export declare enum CallTypeDto {
    AUDIO = "AUDIO",
    VIDEO = "VIDEO"
}
export declare class CreateCallHistoryDto {
    channelId: string;
    streamCallId: string;
    type: CallTypeDto;
    participantIds: string[];
}
