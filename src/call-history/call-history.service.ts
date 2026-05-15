import { Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType } from '@prisma/client';
import { PushService } from '../push/push.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(callerId: string, dto: CreateCallHistoryDto) {
    const type = dto.type.toLowerCase() as CallType;

    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { firstName: true, lastName: true },
    });
    const callerName = caller
      ? `${caller.firstName} ${caller.lastName}`.trim()
      : 'Unknown';

    const history = await this.prisma.callHistory.create({
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

    // Notify each participant (receivers) of the incoming call.
    // channelId 'calls' targets the MAX-importance Android channel so the
    // heads-up / lock-screen notification appears immediately.
    // ttl 30 s: if the device wakes up after the call is already gone the
    // stale notification is discarded by the Expo push service.
    void this.push.sendToUsers(dto.participantIds, {
      title: callerName,
      body: `Incoming ${type} call`,
      priority: 'high',
      channelId: 'calls',
      ttl: 30,
      sound: 'default',
      data: {
        type: 'incoming_call',
        callId: dto.channelId,
        callHistoryId: history.id,
        callerName,
        video: type === 'video',
      },
    });

    return history;
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
      direction:
        row.callerId === userId
          ? 'outgoing'
          : row.status === CallStatus.missed
            ? 'missed'
            : 'incoming',
    }));
  }

  async markAnswered(id: string, _userId: string) {
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
    const call = await this.prisma.callHistory.findUnique({
      where: { id },
      include: { caller: { select: { firstName: true, lastName: true } } },
    });
    if (!call) throw new NotFoundException('Call history not found');

    const endedAt = new Date();
    const durationSeconds = call.answeredAt
      ? Math.floor((endedAt.getTime() - call.answeredAt.getTime()) / 1000)
      : null;

    const newStatus =
      call.status === CallStatus.ringing ? CallStatus.missed : call.status;

    const updated = await this.prisma.callHistory.update({
      where: { id },
      data: { endedAt, durationSeconds, status: newStatus },
      include: {
        caller: { select: participantSelect },
        participants: { select: participantSelect },
      },
    });

    // Send missed-call notification to receivers who never answered
    if (newStatus === CallStatus.missed) {
      const callerName = `${call.caller.firstName} ${call.caller.lastName}`.trim();
      void this.push.sendToUsers(call.participantIds, {
        title: 'Missed call',
        body: `You missed a call from ${callerName}`,
        priority: 'normal',
        channelId: 'default',
        sound: 'default',
        data: {
          type: 'missed_call',
          callId: call.channelId,
          callerName,
        },
      });
    }

    return updated;
  }
}
