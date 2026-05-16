import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type User = Prisma.UserGetPayload<object>;

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
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findPublicById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  async findAll(query?: string) {
    if (!query?.trim()) {
      return [];
    }

    const q = query.trim();
    return this.prisma.user.findMany({
      where: {
        username: q,
      },
      select: publicUserSelect,
      orderBy: { firstName: 'asc' },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();

    if (dto.phoneNumber !== undefined) {
      const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
      const existingPhoneNumber = await this.findByPhoneNumber(phoneNumber);
      if (existingPhoneNumber && existingPhoneNumber.id !== userId) {
        throw new BadRequestException('Phone number already in use');
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

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  normalizePhoneNumber(phoneNumber: string) {
    const trimmed = phoneNumber.trim();
    const digits = trimmed.replaceAll(/\D/g, '');
    return `${trimmed.startsWith('+') ? '+' : ''}${digits}`;
  }

  async deleteAccount(userId: string): Promise<void> {
    // Best-effort: remove from Stream Chat
    try {
      const serverClient = StreamChat.getInstance(
        this.config.getOrThrow('STREAM_API_KEY'),
        this.config.getOrThrow('STREAM_API_SECRET'),
      );
      await serverClient.deleteUser(userId, { mark_messages_deleted: true, hard_delete: true });
    } catch {}

    await this.prisma.$transaction([
      // Must delete caller-owned histories first (FK constraint)
      this.prisma.callHistory.deleteMany({ where: { callerId: userId } }),
      // Delete user — Prisma cascades the implicit many-to-many join table automatically
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }

  async syncStreamUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  }) {
    try {
      const serverClient = StreamChat.getInstance(
        this.config.getOrThrow('STREAM_API_KEY'),
        this.config.getOrThrow('STREAM_API_SECRET'),
      );

      await serverClient.upsertUser({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        username: user.username,
      });
    } catch (error) {
      console.warn('Failed to sync Stream user', error);
    }
  }
}
