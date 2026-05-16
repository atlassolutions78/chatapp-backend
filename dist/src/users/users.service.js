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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stream_chat_1 = require("stream-chat");
const prisma_service_1 = require("../prisma/prisma.service");
const publicUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    email: true,
    phoneNumber: true,
    emailVerified: true,
    lastSeenAt: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async findPublicById(id) {
        return this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({ where: { username } });
    }
    async findByPhoneNumber(phoneNumber) {
        return this.prisma.user.findUnique({ where: { phoneNumber } });
    }
    async findAll(query) {
        if (!query?.trim()) {
            return this.prisma.user.findMany({
                select: publicUserSelect,
                orderBy: { firstName: 'asc' },
            });
        }
        const q = query.trim();
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: q, mode: 'insensitive' } },
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: publicUserSelect,
            orderBy: { firstName: 'asc' },
        });
    }
    async updateProfile(userId, dto) {
        const data = {};
        if (dto.firstName !== undefined)
            data.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined)
            data.lastName = dto.lastName.trim();
        if (dto.phoneNumber !== undefined) {
            const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
            const existingPhoneNumber = await this.findByPhoneNumber(phoneNumber);
            if (existingPhoneNumber && existingPhoneNumber.id !== userId) {
                throw new common_1.BadRequestException('Phone number already in use');
            }
            data.phoneNumber = phoneNumber;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: publicUserSelect,
        });
        await this.syncStreamUser(updatedUser);
        return updatedUser;
    }
    async updateRefreshToken(userId, hashedRefreshToken) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken },
        });
    }
    normalizePhoneNumber(phoneNumber) {
        const trimmed = phoneNumber.trim();
        const digits = trimmed.replaceAll(/\D/g, '');
        return `${trimmed.startsWith('+') ? '+' : ''}${digits}`;
    }
    async deleteAccount(userId) {
        try {
            const serverClient = stream_chat_1.StreamChat.getInstance(this.config.getOrThrow('STREAM_API_KEY'), this.config.getOrThrow('STREAM_API_SECRET'));
            await serverClient.deleteUser(userId, { mark_messages_deleted: true, hard_delete: true });
        }
        catch { }
        await this.prisma.$transaction([
            this.prisma.callHistory.deleteMany({ where: { callerId: userId } }),
            this.prisma.user.delete({ where: { id: userId } }),
        ]);
    }
    async syncStreamUser(user) {
        try {
            const serverClient = stream_chat_1.StreamChat.getInstance(this.config.getOrThrow('STREAM_API_KEY'), this.config.getOrThrow('STREAM_API_SECRET'));
            await serverClient.upsertUser({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                username: user.username,
            });
        }
        catch (error) {
            console.warn('Failed to sync Stream user', error);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map