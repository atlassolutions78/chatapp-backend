import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: 'john',
    description:
      'Preferred username (letters, numbers, underscores). A 2-digit suffix is added automatically.',
  })
  @IsString()
  @MinLength(2)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores',
  })
  username!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
