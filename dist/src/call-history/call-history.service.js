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
exports.CallHistoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const participantSelect = {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    email: true,
};
let CallHistoryService = class CallHistoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(callerId, dto) {
        const type = dto.type.toLowerCase();
        return this.prisma.callHistory.create({
            data: {
                channelId: dto.channelId,
                streamCallId: dto.streamCallId,
                callerId,
                participantIds: dto.participantIds,
                participants: {
                    connect: dto.participantIds.map((id) => ({ id })),
                },
                type,
                status: client_1.CallStatus.ringing,
            },
            include: {
                caller: { select: participantSelect },
                participants: { select: participantSelect },
            },
        });
    }
    async findAllForUser(userId) {
        const rows = await this.prisma.callHistory.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    { participants: { some: { id: userId } } },
                ],
            },
            include: {
                caller: { select: participantSelect },
                participants: { select: participantSelect },
            },
            orderBy: { startedAt: 'desc' },
            take: 100,
        });
        return rows.map((row) => ({
            ...row,
            direction: row.callerId === userId ? 'outgoing' : row.status === client_1.CallStatus.missed ? 'missed' : 'incoming',
        }));
    }
    async markAnswered(id, userId) {
        const call = await this.prisma.callHistory.findUnique({ where: { id } });
        if (!call)
            throw new common_1.NotFoundException('Call history not found');
        return this.prisma.callHistory.update({
            where: { id },
            data: {
                status: client_1.CallStatus.answered,
                answeredAt: new Date(),
            },
            include: {
                caller: { select: participantSelect },
                participants: { select: participantSelect },
            },
        });
    }
    async deleteEntry(id) {
        const call = await this.prisma.callHistory.findUnique({ where: { id } });
        if (!call)
            throw new common_1.NotFoundException('Call history not found');
        await this.prisma.callHistory.delete({ where: { id } });
    }
    async finish(id) {
        const call = await this.prisma.callHistory.findUnique({ where: { id } });
        if (!call)
            throw new common_1.NotFoundException('Call history not found');
        const endedAt = new Date();
        const durationSeconds = call.answeredAt
            ? Math.floor((endedAt.getTime() - call.answeredAt.getTime()) / 1000)
            : null;
        return this.prisma.callHistory.update({
            where: { id },
            data: {
                endedAt,
                durationSeconds,
                status: call.status === client_1.CallStatus.ringing ? client_1.CallStatus.missed : call.status,
            },
            include: {
                caller: { select: participantSelect },
                participants: { select: participantSelect },
            },
        });
    }
};
exports.CallHistoryService = CallHistoryService;
exports.CallHistoryService = CallHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallHistoryService);
//# sourceMappingURL=call-history.service.js.map