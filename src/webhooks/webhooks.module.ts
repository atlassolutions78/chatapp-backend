import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { StreamController } from './stream.controller';

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [StreamController],
})
export class WebhooksModule {}
