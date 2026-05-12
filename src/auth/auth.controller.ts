import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      properties: {
        user: { $ref: '#/components/schemas/UserResponseDto' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already in use',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        user: { $ref: '#/components/schemas/UserResponseDto' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiResponse({
    status: 200,
    description: 'Always returns success to prevent email enumeration',
    schema: { properties: { message: { type: 'string' } } },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New token pair issued',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  refresh(@CurrentUser() user: { sub: string; refreshToken: string }) {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Get('stream-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get Stream Chat token for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Stream Chat token',
    schema: { properties: { token: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  streamToken(@CurrentUser('id') userId: string) {
    return this.authService.streamToken(userId);
  }

  @Get('reset-redirect')
  @ApiOperation({
    summary: 'Redirect browser to app deep link for password reset',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Password reset token from email',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML page that redirects to the app deep link',
  })
  resetRedirect(@Query('token') token: string, @Res() res: Response) {
    const deepLink = `signalclone://reset-password?token=${encodeURIComponent(token ?? '')}`;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <meta http-equiv="refresh" content="0;url=${deepLink}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
  <p>Opening Bond…</p>
  <p>If the app doesn't open, <a href="${deepLink}">tap here</a>.</p>
  <script>window.location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
