import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterTokenDto } from './dto/register-token.dto';
import { PushService } from './push.service';

@ApiTags('Push Tokens')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('push-tokens')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  @HttpCode(204)
  register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.pushService.registerToken(userId, dto.token, dto.platform);
  }

  @Delete()
  @HttpCode(204)
  remove(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.pushService.removeToken(userId, dto.token);
  }
}
