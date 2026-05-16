import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export type User = Prisma.UserGetPayload<object>;
export declare class UsersService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    findById(id: string): Promise<User | null>;
    findPublicById(id: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByPhoneNumber(phoneNumber: string): Promise<User | null>;
    findAll(query?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<void>;
    normalizePhoneNumber(phoneNumber: string): string;
    deleteAccount(userId: string): Promise<void>;
    syncStreamUser(user: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
    }): Promise<void>;
}
