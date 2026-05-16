"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const stream_chat_1 = require("stream-chat");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    prisma;
    usersService;
    jwtService;
    config;
    mail;
    constructor(prisma, usersService, jwtService, config, mail) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.mail = mail;
    }
    async register(dto) {
        if (dto.email) {
            const existingEmail = await this.usersService.findByEmail(dto.email.toLowerCase());
            if (existingEmail)
                throw new common_1.BadRequestException('Email already in use');
        }
        const username = dto.username.trim().toLowerCase();
        const taken = await this.usersService.findByUsername(username);
        if (taken)
            throw new common_1.BadRequestException('Username already taken');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                username,
                email: dto.email ? dto.email.toLowerCase() : null,
                passwordHash,
                emailVerified: true,
            },
        });
        await this.usersService.syncStreamUser(user);
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitize(user), ...tokens };
    }
    async login(dto) {
        const username = dto.username.trim().replace(/^@/, '').toLowerCase();
        const user = await this.usersService.findByUsername(username);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitize(user), ...tokens };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email.toLowerCase());
        if (!user)
            return { message: 'If an account exists, a reset link has been sent.' };
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { resetToken: hashedToken, resetTokenExpiry: expiry },
        });
        const appUrl = this.config.get('APP_URL');
        const resetLink = appUrl
            ? `${appUrl}/api/auth/reset-redirect?token=${rawToken}`
            : `signalclone://reset-password?token=${rawToken}`;
        await this.mail.sendPasswordReset(user.email, user.firstName, resetLink);
        return { message: 'If an account exists, a reset link has been sent.' };
    }
    async resetPassword(token, newPassword) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid or expired reset link');
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
                hashedRefreshToken: null,
            },
        });
        return { message: 'Password reset successfully' };
    }
    async refresh(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.hashedRefreshToken)
            throw new common_1.ForbiddenException();
        const tokenMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
        if (!tokenMatch)
            throw new common_1.ForbiddenException();
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
    }
    async me(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.sanitize(user);
    }
    streamToken(userId) {
        const serverClient = stream_chat_1.StreamChat.getInstance(this.config.getOrThrow('STREAM_API_KEY'), this.config.getOrThrow('STREAM_API_SECRET'));
        const token = serverClient.createToken(userId);
        return { token };
    }
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRY'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRY'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, refreshToken) {
        const hashed = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(userId, hashed);
    }
    sanitize(user) {
        const { passwordHash, hashedRefreshToken, verificationCode, verificationCodeExpiry, resetToken, resetTokenExpiry, ...rest } = user;
        void passwordHash;
        void hashedRefreshToken;
        void verificationCode;
        void verificationCodeExpiry;
        void resetToken;
        void resetTokenExpiry;
        return rest;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map