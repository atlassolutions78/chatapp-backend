import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refresh(user: {
        sub: string;
        refreshToken: string;
    }): Promise<{
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
    resetRedirect(token: string, res: Response): void;
}
