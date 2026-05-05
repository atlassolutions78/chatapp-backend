import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PresenceController } from './presence.controller';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [PresenceGateway, PresenceService],
  controllers: [PresenceController],
  exports: [PresenceService],
})
export class PresenceModule {}
