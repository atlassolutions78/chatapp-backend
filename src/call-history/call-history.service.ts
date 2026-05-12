import { Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallHistoryDto } from './dto/create-call-history.dto';

const participantSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
};

@Injectable()
export class CallHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(callerId: string, dto: CreateCallHistoryDto) {
    const type = dto.type.toLowerCase() as CallType;
    return this.prisma.callHistory.create({
      data: {
        channelId: dto.channelId,
        streamCallId: dto.streamCallId,
        callerId,
        participantIds: dto.participantIds,
        participants: {
          connect: dto.participantIds.map((id) => ({ id })),
        },
        type,
        status: CallStatus.ringing,
      },
      include: {
        caller: { select: participantSelect },
        participants: { select: participantSelect },
      },
    });
  }

  async findAllForUser(userId: string) {
    const rows = await this.prisma.callHistory.findMany({
      where: {
        OR: [
          { callerId: userId },
          { participants: { some: { id: userId } } },
        ],
      },
      include: {
        caller: { select: participantSelect },
        participants: { select: participantSelect },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    return rows.map((row) => ({
      ...row,
      direction: row.callerId === userId ? 'outgoing' : row.status === CallStatus.missed ? 'missed' : 'incoming',
    }));
  }

  async markAnswered(id: string, userId: string) {
    const call = await this.prisma.callHistory.findUnique({ where: { id } });
    if (!call) throw new NotFoundException('Call history not found');
    return this.prisma.callHistory.update({
      where: { id },
      data: {
        status: CallStatus.answered,
        answeredAt: new Date(),
      },
      include: {
        caller: { select: participantSelect },
        participants: { select: participantSelect },
      },
    });
  }

  async deleteEntry(id: string) {
    const call = await this.prisma.callHistory.findUnique({ where: { id } });
    if (!call) throw new NotFoundException('Call history not found');
    await this.prisma.callHistory.delete({ where: { id } });
  }

  async finish(id: string) {
    const call = await this.prisma.callHistory.findUnique({ where: { id } });
    if (!call) throw new NotFoundException('Call history not found');
    const endedAt = new Date();
    const durationSeconds = call.answeredAt
      ? Math.floor((endedAt.getTime() - call.answeredAt.getTime()) / 1000)
      : null;
    return this.prisma.callHistory.update({
      where: { id },
      data: {
        endedAt,
        durationSeconds,
        status: call.status === CallStatus.ringing ? CallStatus.missed : call.status,
      },
      include: {
        caller: { select: participantSelect },
        participants: { select: participantSelect },
      },
    });
  }
}
