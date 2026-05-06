import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CallHistoryController } from './call-history.controller';
import { CallHistoryService } from './call-history.service';

@Module({
  imports: [PrismaModule],
  controllers: [CallHistoryController],
  providers: [CallHistoryService],
})
export class CallHistoryModule {}
