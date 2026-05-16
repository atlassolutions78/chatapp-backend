import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
export type JwtPayload = {
    sub: string;
    email: string | null;
};
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(config: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        passwordHash: string;
        hashedRefreshToken: string | null;
        emailVerified: boolean;
        verificationCode: string | null;
        verificationCodeExpiry: Date | null;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
