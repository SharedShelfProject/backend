import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinPrivateGroupDto {
  @ApiProperty({ description: 'Unique invite code for a private group' })
  @IsString()
  @Length(1, 32)
  inviteCode: string;
}
