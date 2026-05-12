import * as crypto from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StreamChat } from 'stream-chat';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { User, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.email) {
      const existingEmail = await this.usersService.findByEmail(
        dto.email.toLowerCase(),
      );
      if (existingEmail) throw new BadRequestException('Email already in use');
    }

    const base = dto.username.trim().toLowerCase();
    let username: string | null = null;
    for (let i = 0; i < 10; i++) {
      const suffix = Math.floor(Math.random() * 90) + 10; // 10–99
      const candidate = `${base}${suffix}`;
      const taken = await this.usersService.findByUsername(candidate);
      if (!taken) {
        username = candidate;
        break;
      }
    }
    if (!username) {
      throw new BadRequestException(
        'Could not generate a unique username — try a different preferred name',
      );
    }

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

  async login(dto: LoginDto) {
    const username = dto.username.trim().replace(/^@/, '').toLowerCase();
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitize(user), ...tokens };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    // Always return success — prevents email enumeration
    if (!user)
      return { message: 'If an account exists, a reset link has been sent.' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

    const appUrl = this.config.get<string>('APP_URL');
    const resetLink = appUrl
      ? `${appUrl}/api/auth/reset-redirect?token=${rawToken}`
      : `signalclone://reset-password?token=${rawToken}`;
    await this.mail.sendPasswordReset(user.email!, user.firstName, resetLink);

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset link');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        hashedRefreshToken: null, // invalidate all sessions
      },
    });

    return { message: 'Password reset successfully' };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException();

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!tokenMatch) throw new ForbiddenException();

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  streamToken(userId: string) {
    const serverClient = StreamChat.getInstance(
      this.config.getOrThrow('STREAM_API_KEY'),
      this.config.getOrThrow('STREAM_API_SECRET'),
    );
    const token = serverClient.createToken(userId);
    return { token };
  }

  private async generateTokens(userId: string, email: string | null) {
    const payload: JwtPayload = { sub: userId, email };
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

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashed);
  }

  private sanitize(user: User) {
    const {
      passwordHash,
      hashedRefreshToken,
      verificationCode,
      verificationCodeExpiry,
      resetToken,
      resetTokenExpiry,
      ...rest
    } = user;
    void passwordHash;
    void hashedRefreshToken;
    void verificationCode;
    void verificationCodeExpiry;
    void resetToken;
    void resetTokenExpiry;
    return rest;
  }
}
