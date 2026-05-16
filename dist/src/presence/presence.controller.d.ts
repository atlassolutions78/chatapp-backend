import { PresenceService } from './presence.service';
export declare class PresenceController {
    private readonly presenceService;
    constructor(presenceService: PresenceService);
    getPresence(userId: string): Promise<import("./presence.service").PresenceData>;
    getBulkPresence(userIds: string): Promise<import("./presence.service").PresenceData[]>;
}
