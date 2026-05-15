import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stream Chat & Video webhook receiver' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleStream(
    @Req() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const signature = (req.headers['x-signature'] as string) ?? '';
    const rawBody = (req.rawBody as Buffer | undefined)?.toString('utf8') ?? '';

    if (!this.webhooksService.verifyStreamSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    await this.webhooksService.handleEvent(body);
    return { ok: true };
  }
}
