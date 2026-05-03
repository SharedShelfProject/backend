import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsOptional, IsString, Length} from 'class-validator';

export class JoinGroupDto {
    @ApiPropertyOptional({description: 'Invite code required for private groups'})
    @IsOptional()
    @IsString()
    @Length(1, 32)
    inviteCode?: string;
}
