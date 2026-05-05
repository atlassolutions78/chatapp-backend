import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john_12' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'SecurePass1!' })
  @IsString()
  password!: string;
}
