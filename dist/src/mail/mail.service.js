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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    config;
    transporter = null;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const host = this.config.get('SMTP_HOST');
        if (!host)
            return;
        this.transporter = nodemailer.createTransport({
            host,
            port: this.config.get('SMTP_PORT') ?? 587,
            secure: false,
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASS'),
            },
            tls: { rejectUnauthorized: false },
        });
    }
    async sendVerificationCode(to, code, name) {
        await this.send(to, 'Your Bond verification code', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111827;">Hey ${name},</h2>
        <p style="color:#6B7280;">Your verification code for Bond is:</p>
        <div style="background:#F3F4F6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#2563EB;">${code}</span>
        </div>
        <p style="color:#6B7280;font-size:14px;">This code expires in 10 minutes. If you didn't create a Bond account, you can ignore this email.</p>
      </div>
    `);
    }
    async sendPasswordReset(to, name, resetLink) {
        await this.send(to, 'Reset your Bond password', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111827;">Hey ${name},</h2>
        <p style="color:#6B7280;">We received a request to reset your Bond password.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetLink}"
            style="background:#2563EB;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
            Reset Password
          </a>
        </div>
        <p style="color:#6B7280;font-size:14px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
      </div>
    `);
    }
    async send(to, subject, html) {
        if (!this.transporter)
            return;
        await this.transporter.sendMail({
            from: this.config.get('SMTP_FROM') ??
                `Bond <${this.config.get('SMTP_USER')}>`,
            to,
            subject,
            html,
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map