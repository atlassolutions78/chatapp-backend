import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PresenceService } from './presence.service';

const presenceSchema = {
  properties: {
    userId: { type: 'string' },
    isOnline: { type: 'boolean' },
    lastSeenAt: { type: 'string', nullable: true, example: '2026-05-05T10:00:00.000Z' },
  },
};

@ApiTags('Presence')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @ApiOperation({ summary: 'Get presence for a single user' })
  @ApiParam({ name: 'userId', description: 'ID of the user to check' })
  @ApiResponse({ status: 200, description: 'Presence data for the user', schema: presenceSchema })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':userId')
  getPresence(@Param('userId') userId: string) {
    return this.presenceService.getPresence(userId);
  }

  @ApiOperation({ summary: 'Get presence for multiple users' })
  @ApiQuery({ name: 'userIds', description: 'Comma-separated list of user IDs', example: 'id1,id2,id3' })
  @ApiResponse({
    status: 200,
    description: 'Presence data for each requested user',
    schema: { type: 'array', items: presenceSchema },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  getBulkPresence(@Query('userIds') userIds: string) {
    const ids = userIds?.split(',').filter(Boolean) ?? [];
    return this.presenceService.getBulkPresence(ids);
  }
}
