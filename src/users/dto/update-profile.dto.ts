import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9][0-9\s().-]{6,24}$/, {
    message: 'Phone number must be a valid phone number',
  })
  phoneNumber?: string;
}
