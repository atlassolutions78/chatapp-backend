import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) return;

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
      tls: { rejectUnauthorized: false },
    });
  }

  async sendVerificationCode(to: string, code: string, name: string) {
    await this.send(
      to,
      'Your Bond verification code',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111827;">Hey ${name},</h2>
        <p style="color:#6B7280;">Your verification code for Bond is:</p>
        <div style="background:#F3F4F6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#2563EB;">${code}</span>
        </div>
        <p style="color:#6B7280;font-size:14px;">This code expires in 10 minutes. If you didn't create a Bond account, you can ignore this email.</p>
      </div>
    `,
    );
  }

  async sendPasswordReset(to: string, name: string, resetLink: string) {
    await this.send(
      to,
      'Reset your Bond password',
      `
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
    `,
    );
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) return;

    await this.transporter.sendMail({
      from:
        this.config.get('SMTP_FROM') ??
        `Bond <${this.config.get('SMTP_USER')}>`,
      to,
      subject,
      html,
    });
  }
}
