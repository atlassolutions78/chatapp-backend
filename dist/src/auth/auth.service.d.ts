import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private usersService;
    private jwtService;
    private config;
    private mail;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, config: ConfigService, mail: MailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
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
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
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
        };
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    refresh(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    me(userId: string): Promise<{
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
    streamToken(userId: string): {
        token: string;
    };
    private generateTokens;
    private storeRefreshToken;
    private sanitize;
}
