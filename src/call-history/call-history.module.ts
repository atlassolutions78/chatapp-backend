import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { CallHistoryController } from './call-history.controller';
import { CallHistoryService } from './call-history.service';

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [CallHistoryController],
  providers: [CallHistoryService],
})
export class CallHistoryModule {}
