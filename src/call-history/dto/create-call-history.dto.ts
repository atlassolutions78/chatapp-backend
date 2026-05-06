import { IsArray, IsEnum, IsString } from 'class-validator';

export enum CallTypeDto {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export class CreateCallHistoryDto {
  @IsString()
  channelId: string;

  @IsString()
  streamCallId: string;

  @IsEnum(CallTypeDto)
  type: CallTypeDto;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
