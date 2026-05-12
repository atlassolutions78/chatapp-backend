import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallHistoryService } from './call-history.service';
import { CreateCallHistoryDto } from './dto/create-call-history.dto';

@ApiTags('Call History')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('call-history')
export class CallHistoryController {
  constructor(private readonly callHistoryService: CallHistoryService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCallHistoryDto) {
    return this.callHistoryService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.callHistoryService.findAllForUser(userId);
  }

  @Patch(':id/answered')
  markAnswered(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.callHistoryService.markAnswered(id, userId);
  }

  @Patch(':id/ended')
  finish(@Param('id') id: string) {
    return this.callHistoryService.finish(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.callHistoryService.deleteEntry(id);
  }
}
