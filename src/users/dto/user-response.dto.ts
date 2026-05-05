import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'clxyz1234abcd' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'john_12' })
  username!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: true })
  emailVerified!: boolean;

  @ApiProperty({ example: '+27821234567', nullable: true })
  phoneNumber!: string | null;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z', nullable: true })
  lastSeenAt!: Date | null;

  @ApiProperty({ example: '2026-05-04T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-04T09:00:00.000Z' })
  updatedAt!: Date;
}
