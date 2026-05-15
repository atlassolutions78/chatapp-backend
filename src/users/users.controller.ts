import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushTokenDto } from './dto/push-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Find a user by exact username (case-sensitive)' })
  @ApiQuery({ name: 'q', required: false, description: 'Exact username to look up' })
  @ApiResponse({
    status: 200,
    description: 'Matching users, or empty array if no query provided',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(@Query('q') q?: string) {
    return this.usersService.findAll(q);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findPublicById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate phone number',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register an Expo push token for the current user' })
  @ApiResponse({ status: 204, description: 'Token saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  savePushToken(@CurrentUser('id') userId: string, @Body() dto: PushTokenDto) {
    return this.usersService.savePushToken(userId, dto.token);
  }

  @Delete('me/push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an Expo push token (on sign out)' })
  @ApiResponse({ status: 204, description: 'Token removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  removePushToken(@Body() dto: PushTokenDto) {
    return this.usersService.removePushToken(dto.token);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete the current user account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteMe(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
