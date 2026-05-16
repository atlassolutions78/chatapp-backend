import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MailService implements OnModuleInit {
    private config;
    private transporter;
    constructor(config: ConfigService);
    onModuleInit(): void;
    sendVerificationCode(to: string, code: string, name: string): Promise<void>;
    sendPasswordReset(to: string, name: string, resetLink: string): Promise<void>;
    private send;
}
